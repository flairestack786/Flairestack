'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { canAccessModule, normalizeCmsRole } from '@/lib/cmsPermissions'
import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

type CmsRole = 'administrator' | 'editor' | 'sales'

type CmsProfile = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  status?: string | null
  [key: string]: unknown
}

type NextAuthContextValue = {
  session: Session | null
  user: User | null
  profile: CmsProfile | null
  /** Null when profile is missing — never defaults to administrator. */
  cmsRole: CmsRole | null
  isActiveCmsUser: boolean
  isAdministrator: boolean
  isPasswordRecovery: boolean
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  clearPasswordRecovery: () => void
  canAccess: (moduleId: string) => boolean
  signIn: (email: string, password: string) => Promise<unknown>
  signOut: () => Promise<void>
}

function resolveCmsRoleFromProfile(profile: CmsProfile | null): CmsRole | null {
  if (!profile) return null
  const role = profile.role
  if (role === 'administrator' || role === 'editor' || role === 'sales') {
    return role
  }
  if (role == null || role === '') return null
  // Known non-empty but unexpected values: normalize without inventing a role for null profiles.
  return normalizeCmsRole(String(role))
}

const NextAuthContext = createContext<NextAuthContextValue | null>(null)

/** Separate from Vite's key so concurrent ports never share recovery flags. */
const PASSWORD_RECOVERY_STORAGE_KEY = 'flaire_next_cms_password_recovery'

const PROFILE_SELECT =
  'id, email, full_name, avatar_path, role, status, permissions, invited_at, last_sign_in_at, notes, created_at, updated_at'

function urlIndicatesPasswordRecovery(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const hash = window.location.hash?.replace(/^#/, '') ?? ''
    const search = window.location.search?.replace(/^\?/, '') ?? ''
    const fromHash = new URLSearchParams(hash).get('type')
    const fromSearch = new URLSearchParams(search).get('type')
    return fromHash === 'recovery' || fromSearch === 'recovery'
  } catch {
    return false
  }
}

function readStoredPasswordRecovery(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStoredPasswordRecovery(active: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (active) {
      window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, '1')
    } else {
      window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

async function fetchCurrentProfile(): Promise<CmsProfile | null> {
  const supabase = getSupabaseBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return (data as CmsProfile | null) ?? null
}

export function NextAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<CmsProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [configError, setConfigError] = useState('')

  const clearPasswordRecovery = useCallback(() => {
    writeStoredPasswordRecovery(false)
    setIsPasswordRecovery(false)
  }, [])

  const markPasswordRecovery = useCallback(() => {
    writeStoredPasswordRecovery(true)
    setIsPasswordRecovery(true)
  }, [])

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const row = await fetchCurrentProfile()
      setProfile(row)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (urlIndicatesPasswordRecovery() || readStoredPasswordRecovery()) {
      markPasswordRecovery()
    }

    let supabase
    try {
      supabase = getSupabaseBrowser()
    } catch (err) {
      if (!mounted) return
      setConfigured(false)
      setConfigError(err instanceof Error ? err.message : 'Supabase is not configured for Next.js.')
      setLoading(false)
      setProfileLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!mounted) return
      setSession(current)
      setUser(current?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        markPasswordRecovery()
      } else if (event === 'SIGNED_OUT') {
        clearPasswordRecovery()
      } else if (event === 'SIGNED_IN' && !readStoredPasswordRecovery()) {
        // Normal sign-in must never inherit a stale recovery flag.
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [markPasswordRecovery, clearPasswordRecovery])

  useEffect(() => {
    if (!configured) return
    if (!user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    refreshProfile()
  }, [user?.id, refreshProfile, configured])

  const signIn = async (email: string, password: string) => {
    clearPasswordRecovery()
    const supabase = getSupabaseBrowser()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearPasswordRecovery()
    setProfile(null)
  }

  const cmsRole = resolveCmsRoleFromProfile(profile)
  const isActiveCmsUser = profile?.status === 'active'
  const isAdministrator = cmsRole === 'administrator' && isActiveCmsUser

  const value = useMemo<NextAuthContextValue>(
    () => ({
      session,
      user,
      profile,
      cmsRole,
      isActiveCmsUser,
      isAdministrator,
      isPasswordRecovery,
      loading,
      profileLoading,
      refreshProfile,
      clearPasswordRecovery,
      canAccess: (moduleId) =>
        cmsRole != null && canAccessModule(cmsRole, moduleId as never),
      signIn,
      signOut,
    }),
    [
      session,
      user,
      profile,
      cmsRole,
      isActiveCmsUser,
      isAdministrator,
      isPasswordRecovery,
      loading,
      profileLoading,
      refreshProfile,
      clearPasswordRecovery,
    ]
  )

  if (!configured) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          background: '#050505',
          color: '#f5f5f5',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '28rem', lineHeight: 1.5 }}>
          <p style={{ color: '#ff7a00', fontWeight: 700 }}>NEXT.JS AUTH</p>
          <h1 style={{ fontSize: '1.25rem' }}>Supabase env missing</h1>
          <p style={{ color: 'rgba(245,245,245,0.7)' }}>{configError}</p>
          <p style={{ color: 'rgba(245,245,245,0.55)', fontSize: '0.875rem' }}>
            Copy your project URL and anon key into{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
            <code> .env.local</code>. Vite continues to use <code>VITE_*</code>.
          </p>
        </div>
      </div>
    )
  }

  return <NextAuthContext.Provider value={value}>{children}</NextAuthContext.Provider>
}

export function useNextAuth() {
  const context = useContext(NextAuthContext)
  if (!context) {
    throw new Error('useNextAuth must be used within a NextAuthProvider')
  }
  return context
}
