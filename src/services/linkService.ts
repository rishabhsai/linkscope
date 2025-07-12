import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

// Get username from localStorage
function getUsername(): string {
  const username = localStorage.getItem('username')
  if (!username) throw new Error('No username set')
  return username
}

type AnalyzedLink = Database['public']['Tables']['analyzed_links']['Row']
type InsertLink = Database['public']['Tables']['analyzed_links']['Insert']
type UpdateLink = Database['public']['Tables']['analyzed_links']['Update']

export interface LocalAnalyzedLink {
  id: string
  url: string
  title?: string
  summary: string
  tags: string[]
  context?: string
  createdAt: Date
  updatedAt?: Date
  type: 'video' | 'link'
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'other'
  // Enhanced fields
  status: 'active' | 'todo' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  userId: string
  thumbnail?: string
  description?: string
  isManuallyAdded: boolean
  accessCount: number
  lastAccessed?: Date
  order?: number
}

export const linkService = {
  // Fetch all links for the current user
  async getLinks(): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || undefined,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      updatedAt: link.updated_at ? new Date(link.updated_at) : undefined,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      dueDate: link.due_date ? new Date(link.due_date) : undefined,
      userId: link.user_id,
      thumbnail: link.thumbnail || undefined,
      description: link.description || undefined,
      isManuallyAdded: link.is_manually_added || false,
      accessCount: link.access_count || 0,
      lastAccessed: link.last_accessed ? new Date(link.last_accessed) : undefined,
      order: link.order || 0,
    }))
  },

  // Get links by status
  async getLinksByStatus(status: 'active' | 'todo' | 'completed' | 'archived'): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', status)
      .order('order', { ascending: true })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || undefined,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      updatedAt: link.updated_at ? new Date(link.updated_at) : undefined,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      dueDate: link.due_date ? new Date(link.due_date) : undefined,
      userId: link.user_id,
      thumbnail: link.thumbnail || undefined,
      description: link.description || undefined,
      isManuallyAdded: link.is_manually_added || false,
      accessCount: link.access_count || 0,
      lastAccessed: link.last_accessed ? new Date(link.last_accessed) : undefined,
      order: link.order || 0,
    }))
  },

  // Create a new link manually (without AI)
  async createLinkManually(linkData: {
    url: string
    title?: string
    summary: string
    tags: string[]
    context?: string
    status?: 'active' | 'todo' | 'completed' | 'archived'
    priority?: 'low' | 'medium' | 'high'
    dueDate?: Date
  }): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const linkInfo = this.detectLinkType(linkData.url)
    const insertData: InsertLink = {
      user_id,
      url: linkData.url,
      title: linkData.title || null,
      summary: linkData.summary,
      tags: linkData.tags,
      context: linkData.context || null,
      type: linkInfo.type,
      platform: linkInfo.platform,
      status: linkData.status || 'active',
      priority: linkData.priority || 'medium',
      due_date: linkData.dueDate?.toISOString() || null,
      is_manually_added: true,
      access_count: 0,
      order: 0,
    }
    const { data, error } = await supabase
      .from('analyzed_links')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      url: data.url,
      title: data.title || undefined,
      summary: data.summary,
      tags: data.tags,
      context: data.context || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      type: data.type,
      platform: data.platform,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      userId: data.user_id,
      thumbnail: data.thumbnail || undefined,
      description: data.description || undefined,
      isManuallyAdded: data.is_manually_added || false,
      accessCount: data.access_count || 0,
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
      order: data.order || 0,
    }
  },

  // Create a new link with AI analysis
  async createLink(link: Omit<LocalAnalyzedLink, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isManuallyAdded' | 'accessCount'>): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const insertData: InsertLink = {
      user_id,
      url: link.url,
      title: link.title || null,
      summary: link.summary,
      tags: link.tags,
      context: link.context || null,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      due_date: link.dueDate?.toISOString() || null,
      thumbnail: link.thumbnail || null,
      description: link.description || null,
      is_manually_added: false,
      access_count: 0,
      order: link.order || 0,
    }
    const { data, error } = await supabase
      .from('analyzed_links')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      url: data.url,
      title: data.title || undefined,
      summary: data.summary,
      tags: data.tags,
      context: data.context || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      type: data.type,
      platform: data.platform,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      userId: data.user_id,
      thumbnail: data.thumbnail || undefined,
      description: data.description || undefined,
      isManuallyAdded: data.is_manually_added || false,
      accessCount: data.access_count || 0,
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
      order: data.order || 0,
    }
  },

  // Update a link
  async updateLink(id: string, updates: Partial<Omit<LocalAnalyzedLink, 'id' | 'createdAt' | 'userId'>>): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const updateData: UpdateLink = {
      ...updates.title && { title: updates.title },
      ...updates.summary && { summary: updates.summary },
      ...updates.tags && { tags: updates.tags },
      ...updates.context !== undefined && { context: updates.context },
      ...updates.status && { status: updates.status },
      ...updates.priority && { priority: updates.priority },
      ...updates.dueDate !== undefined && { due_date: updates.dueDate?.toISOString() },
      ...updates.thumbnail !== undefined && { thumbnail: updates.thumbnail },
      ...updates.description !== undefined && { description: updates.description },
      ...updates.order !== undefined && { order: updates.order },
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('analyzed_links')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      url: data.url,
      title: data.title || undefined,
      summary: data.summary,
      tags: data.tags,
      context: data.context || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      type: data.type,
      platform: data.platform,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      userId: data.user_id,
      thumbnail: data.thumbnail || undefined,
      description: data.description || undefined,
      isManuallyAdded: data.is_manually_added || false,
      accessCount: data.access_count || 0,
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
      order: data.order || 0,
    }
  },

  // Track link access
  async trackAccess(id: string): Promise<void> {
    const user_id = getUsername()
    const { error } = await supabase
      .from('analyzed_links')
      .update({
        access_count: supabase.raw('access_count + 1'),
        last_accessed: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
    if (error) throw error
  },

  // Update order for drag & drop
  async updateOrder(updates: { id: string; order: number }[]): Promise<void> {
    const user_id = getUsername()
    const promises = updates.map(update =>
      supabase
        .from('analyzed_links')
        .update({ order: update.order })
        .eq('id', update.id)
        .eq('user_id', user_id)
    )
    await Promise.all(promises)
  },

  // Delete a link
  async deleteLink(id: string): Promise<void> {
    const user_id = getUsername()
    const { error } = await supabase
      .from('analyzed_links')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
    if (error) throw error
  },

  // Search links
  async searchLinks(query: string): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .or(`url.ilike.%${query}%,summary.ilike.%${query}%,title.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || undefined,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      updatedAt: link.updated_at ? new Date(link.updated_at) : undefined,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      dueDate: link.due_date ? new Date(link.due_date) : undefined,
      userId: link.user_id,
      thumbnail: link.thumbnail || undefined,
      description: link.description || undefined,
      isManuallyAdded: link.is_manually_added || false,
      accessCount: link.access_count || 0,
      lastAccessed: link.last_accessed ? new Date(link.last_accessed) : undefined,
      order: link.order || 0,
    }))
  },

  // Get links by tag
  async getLinksByTag(tag: string): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || undefined,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      updatedAt: link.updated_at ? new Date(link.updated_at) : undefined,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      dueDate: link.due_date ? new Date(link.due_date) : undefined,
      userId: link.user_id,
      thumbnail: link.thumbnail || undefined,
      description: link.description || undefined,
      isManuallyAdded: link.is_manually_added || false,
      accessCount: link.access_count || 0,
      lastAccessed: link.last_accessed ? new Date(link.last_accessed) : undefined,
      order: link.order || 0,
    }))
  },

  // Get links by type
  async getLinksByType(type: 'video' | 'link'): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .eq('type', type)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || undefined,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      updatedAt: link.updated_at ? new Date(link.updated_at) : undefined,
      type: link.type,
      platform: link.platform,
      status: link.status || 'active',
      priority: link.priority || 'medium',
      dueDate: link.due_date ? new Date(link.due_date) : undefined,
      userId: link.user_id,
      thumbnail: link.thumbnail || undefined,
      description: link.description || undefined,
      isManuallyAdded: link.is_manually_added || false,
      accessCount: link.access_count || 0,
      lastAccessed: link.last_accessed ? new Date(link.last_accessed) : undefined,
      order: link.order || 0,
    }))
  },

  // Helper function to detect link type
  detectLinkType(url: string): { type: 'video' | 'link', platform: 'youtube' | 'instagram' | 'tiktok' | 'other' } {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return { type: 'video', platform: 'youtube' }
    }
    if (lowerUrl.includes('instagram.com') && (lowerUrl.includes('/reel/') || lowerUrl.includes('/tv/'))) {
      return { type: 'video', platform: 'instagram' }
    }
    if (lowerUrl.includes('tiktok.com')) {
      return { type: 'video', platform: 'tiktok' }
    }
    return { type: 'link', platform: 'other' }
  }
} 