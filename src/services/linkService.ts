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
  summary: string
  tags: string[]
  context?: string
  createdAt: Date
  type: 'video' | 'link'
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'other'
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
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      type: link.type,
      platform: link.platform,
    }))
  },

  // Create a new link
  async createLink(link: Omit<LocalAnalyzedLink, 'id' | 'createdAt'>): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const insertData: InsertLink = {
      user_id,
      url: link.url,
      summary: link.summary,
      tags: link.tags,
      context: link.context || null,
      type: link.type,
      platform: link.platform,
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
      summary: data.summary,
      tags: data.tags,
      context: data.context || undefined,
      createdAt: new Date(data.created_at),
      type: data.type,
      platform: data.platform,
    }
  },

  // Update a link
  async updateLink(id: string, updates: Partial<UpdateLink>): Promise<LocalAnalyzedLink> {
    const user_id = getUsername()
    const { data, error } = await supabase
      .from('analyzed_links')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      url: data.url,
      summary: data.summary,
      tags: data.tags,
      context: data.context || undefined,
      createdAt: new Date(data.created_at),
      type: data.type,
      platform: data.platform,
    }
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
      .or(`url.ilike.%${query}%,summary.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(link => ({
      id: link.id,
      url: link.url,
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      type: link.type,
      platform: link.platform,
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
      summary: link.summary,
      tags: link.tags,
      context: link.context || undefined,
      createdAt: new Date(link.created_at),
      type: link.type,
      platform: link.platform,
    }))
  }
} 