import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      lists: {
        Row: {
          id: string
          items: any[]
          updated_at: string
        }
        Insert: {
          id: string
          items: any[]
          updated_at?: string
        }
        Update: {
          id?: string
          items?: any[]
          updated_at?: string
        }
      }
    }
  }
}