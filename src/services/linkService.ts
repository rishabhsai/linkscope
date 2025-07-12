import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

interface AnalysisResult {
  summary: string;
  tags: string[];
  insights?: string[];
}

type AnalyzedLink = Database['public']['Tables']['analyzed_links']['Row'];
type InsertLink = Database['public']['Tables']['analyzed_links']['Insert'];
type UpdateLink = Database['public']['Tables']['analyzed_links']['Update'];

// Get username from localStorage
function getUsername(): string {
  const username = localStorage.getItem('username')
  if (!username) throw new Error('No username set')
  return username
}

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
  // Simplified fields
  status: 'active' | 'todo' | 'completed' | 'archived'
  priority?: string
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
  // Fetch shared links (active/archived) for all users + personal todos for current user
  async getLinks(): Promise<LocalAnalyzedLink[]> {
    const user_id = getUsername()
    
    // Get all shared links (active/archived from all users)
    const { data: sharedLinks, error: sharedError } = await supabase
      .from('analyzed_links')
      .select('*')
      .in('status', ['active', 'archived'])
      .order('created_at', { ascending: false })
    
    if (sharedError) throw sharedError
    
    // Get personal todos for current user
    const { data: personalTodos, error: todosError } = await supabase
      .from('analyzed_links')
      .select('*')
      .eq('user_id', user_id)
      .in('status', ['todo', 'completed'])
      .order('created_at', { ascending: false })
    
    if (todosError) throw todosError
    
         // Combine both datasets
     const allLinks = [...(sharedLinks || []), ...(personalTodos || [])]
     return allLinks.map(link => ({
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
      order: link.order_index || 0,
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
  }): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const linkInfo = this.detectLinkType(linkData.url)
    const insertData: InsertLink = {
      user_id,
      url: linkData.url,
      summary: linkData.summary,
      tags: linkData.tags,
      context: linkData.context || null,
      type: linkInfo.type,
      platform: linkInfo.platform,
      status: linkData.status || 'active',
      is_manually_added: true,
      access_count: 0,
      order_index: 0,
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
      order: data.order_index || 0,
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
      order_index: link.order || 0,
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
      ...updates.order !== undefined && { order_index: updates.order },
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
      order: data.order_index || 0,
    }
  },

  // Track link access
  async trackAccess(id: string): Promise<void> {
    const user_id = getUsername()
    const { error } = await supabase
      .from('analyzed_links')
      .update({
        access_count: 1, // This will be incremented by a separate query
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
        .update({ order_index: update.order })
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
      order: link.order_index || 0,
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
      order: link.order_index || 0,
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
      order: link.order_index || 0,
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
  },

  analyzeLink: async (url: string, context?: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/analyze-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        context,
        prompt: `Please analyze this ${context ? 'link in the context of: ' + context : 'link'} and provide:
1. A clear, detailed summary (2-3 sentences) that captures the main purpose and value of the content
2. Relevant tags (5-8) that categorize the content, including:
   - Content type (article, tutorial, documentation, etc.)
   - Main topics and subtopics
   - Technologies or tools mentioned
   - Skill level if applicable
3. Extract any key points, insights, or actionable items
4. Consider the broader context and potential use cases

Format your response as a JSON object with these fields:
{
  "summary": "Your detailed summary here",
  "tags": ["tag1", "tag2", "tag3"],
  "insights": ["key point 1", "key point 2"]
}`
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}; 