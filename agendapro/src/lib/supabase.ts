import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

type ScheduleEntry = {
  active: boolean
  start: string
  end: string
}

type WhatsAppSettings = {
  confirmacao: boolean
  lembrete24h: boolean
  lembrete1h: boolean
  cancelamento: boolean
  avaliacaoPos: boolean
}

type WhatsAppTemplates = {
  confirmacao: string
  lembrete24h: string
  lembrete1h: string
  cancelamento: string
  avaliacaoPos: string
}

type MarketingSettings = {
  coupon: {
    code: string
    discount: string
    type: 'percent' | 'fixed'
  }
  selectedPost: number
}

type ProfilePhotos = string[]

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
          public_phone: boolean
          city: string | null
          state: string | null
          avatar_url: string | null
          cover_url: string | null
          plan: 'free' | 'pro' | 'business'
          role: 'user' | 'admin'
          rating: number
          review_count: number
          slug: string
          referred_by: string | null
          schedule: Record<string, ScheduleEntry>
          booking_enabled: boolean
          booking_requires_confirmation: boolean
          whatsapp_settings: WhatsAppSettings
          whatsapp_templates: WhatsAppTemplates
          marketing_settings: MarketingSettings
          photos: ProfilePhotos
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
          service_id: string | null
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
      referrals: {
        Row: {
          id: string
          referrer_profile_id: string
          referred_profile_id: string
          referral_slug: string
          status: 'registered' | 'converted'
          converted_plan: 'pro' | 'business' | null
          credit_amount: number
          converted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          full_name: string
          profession: string
          bio: string | null
          city: string | null
          state: string | null
          avatar_url: string | null
          cover_url: string | null
          rating: number
          review_count: number
          slug: string
          plan: 'free' | 'pro' | 'business'
          booking_enabled: boolean
          booking_requires_confirmation: boolean
          phone: string | null
          photos: ProfilePhotos
        }
      }
    }
    Functions: {
      get_public_booked_slots: {
        Args: {
          profile_uuid: string
          slot_date: string
        }
        Returns: {
          slot_time: string
        }[]
      }
      get_public_referrer: {
        Args: {
          ref_slug: string
        }
        Returns: {
          profile_id: string
          full_name: string
          profession: string
          slug: string
        }[]
      }
      get_public_review_request: {
        Args: {
          review_appointment_id: string
        }
        Returns: {
          appointment_id: string
          profile_id: string
          professional_name: string
          professional_slug: string
          service_name: string
          client_name: string
          appointment_date: string
          appointment_time: string
          review_exists: boolean
        }[]
      }
    }
  }
}

