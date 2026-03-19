import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  full_name: string
  profession: string
  plan: 'free' | 'pro' | 'business'
  avatar_url: string | null
  slug: string
  rating: number
  review_count: number
  phone: string | null
  referred_by?: string | null
  role?: 'user' | 'admin'
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, profession: string, refSlug?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
}

type ProfileRow = Omit<Profile, 'role'> & { role?: 'user' | 'admin' }

const AuthContext = createContext<AuthContextType | null>(null)

const profileSelectWithRole = 'id, full_name, profession, plan, avatar_url, slug, rating, review_count, phone, referred_by, role'
const profileSelectLegacy = 'id, full_name, profession, plan, avatar_url, slug, rating, review_count, phone, referred_by'

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildProfileSeed = (authUser: User) => {
  const metadata = authUser.user_metadata as { full_name?: string; profession?: string } | undefined
  const fallbackName = authUser.email?.split('@')[0] ?? 'Novo Usuario'
  const fullName = metadata?.full_name?.trim() || fallbackName
  const profession = metadata?.profession?.trim() || 'Profissional'
  const slugBase = slugify(fullName) || `usuario-${authUser.id.slice(0, 8)}`

  return {
    id: authUser.id,
    full_name: fullName,
    profession,
    plan: 'free' as const,
    slug: `${slugBase}-${authUser.id.slice(0, 6)}`,
  }
}

function getUserRole(authUser: User, row?: { role?: 'user' | 'admin' } | null) {
  const appRole = authUser.app_metadata?.role
  return row?.role ?? (appRole === 'admin' ? 'admin' : 'user')
}

function normalizeProfile(authUser: User, row: ProfileRow) {
  return {
    ...row,
    role: getUserRole(authUser, row),
  } as Profile
}

async function selectProfile(authUser: User) {
  const withRole = await supabase
    .from('profiles')
    .select(profileSelectWithRole)
    .eq('id', authUser.id)
    .maybeSingle()

  if (!withRole.error) return { data: withRole.data as ProfileRow | null, usedLegacy: false }

  const legacy = await supabase
    .from('profiles')
    .select(profileSelectLegacy)
    .eq('id', authUser.id)
    .maybeSingle()

  if (legacy.error) return { data: null, usedLegacy: true }
  return { data: legacy.data as ProfileRow | null, usedLegacy: true }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureProfile = useCallback(async (authUser: User) => {
    const seed = buildProfileSeed(authUser)
    await supabase.from('profiles').upsert(seed, { onConflict: 'id' })

    const { data } = await selectProfile(authUser)
    if (!data) {
      setProfile(null)
      return null
    }

    const nextProfile = normalizeProfile(authUser, data)
    setProfile(nextProfile)
    return nextProfile
  }, [])

  const fetchProfile = useCallback(async (authUser: User) => {
    const { data } = await selectProfile(authUser)

    if (data) {
      const nextProfile = normalizeProfile(authUser, data)
      setProfile(nextProfile)
      return nextProfile
    }

    return ensureProfile(authUser)
  }, [ensureProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user)
  }, [fetchProfile, user])

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: nextSession } } = await supabase.auth.getSession()
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) await fetchProfile(nextSession.user)
      else setProfile(null)

      setLoading(false)
    }

    void loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) {
        void fetchProfile(nextSession.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string, profession: string, refSlug?: string) => {
    const slug = `${slugify(fullName) || 'usuario'}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, profession } },
    })

    if (error) return { error: error.message }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName,
          profession,
          plan: 'free',
          slug,
          ...(refSlug ? { referred_by: refSlug } : {}),
        },
        { onConflict: 'id' }
      )

      if (profileError) return { error: profileError.message }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
