import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      analyzed_links: {
        Row: {
          id: string
          user_id: string // username
          url: string
          summary: string
          tags: string[]
          context: string | null
          type: 'video' | 'link'
          platform: 'youtube' | 'instagram' | 'tiktok' | 'other'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          summary: string
          tags: string[]
          context?: string | null
          type: 'video' | 'link'
          platform: 'youtube' | 'instagram' | 'tiktok' | 'other'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          summary?: string
          tags?: string[]
          context?: string | null
          type?: 'video' | 'link'
          platform?: 'youtube' | 'instagram' | 'tiktok' | 'other'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 