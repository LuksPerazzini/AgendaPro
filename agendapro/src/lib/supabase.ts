import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          profession: string
          bio: string | null
          phone: string | null
          city: string | null
          state: string | null
          avatar_url: string | null
          cover_url: string | null
          plan: 'free' | 'pro' | 'business'
          rating: number
          review_count: number
          slug: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'rating' | 'review_count'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      services: {
        Row: {
          id: string
          profile_id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          profile_id: string
          service_id: string
          client_name: string
          client_phone: string
          client_email: string | null
          date: string
          time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          profile_id: string
          appointment_id: string | null
          client_name: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
    }
  }
}
