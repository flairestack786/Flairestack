import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/users'
import { canAccessModule, normalizeCmsRole } from '../lib/cmsPermissions'

const AuthContext = createContext(null)

const PASSWORD_RECOVERY_STORAGE_KEY = 'flaire_cms_password_recovery'

/**
 * Supabase recovery links include type=recovery in the URL hash or query.
 * @returns {boolean}
 */
function urlIndicatesPasswordRecovery() {
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

/**
 * @returns {boolean}
 */
function readStoredPasswordRecovery() {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * @param {boolean} active
 */
function writeStoredPasswordRecovery(active) {
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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return urlIndicatesPasswordRecovery() || readStoredPasswordRecovery()
  })

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
      const row = await getCurrentProfile()
      setProfile(row)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (urlIndicatesPasswordRecovery()) {
      markPasswordRecovery()
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
        // Normal sign-in must never inherit a stale recovery flag from another tab/path.
        // Keep recovery only when explicitly marked (PASSWORD_RECOVERY or recovery URL).
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
    if (!user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    refreshProfile()
  }, [user?.id, refreshProfile])

  const signIn = async (email, password) => {
    clearPasswordRecovery()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearPasswordRecovery()
    setProfile(null)
  }

  const cmsRole = normalizeCmsRole(String(profile?.role ?? 'administrator'))
  const isActiveCmsUser = profile?.status === 'active'
  const isAdministrator = cmsRole === 'administrator' && isActiveCmsUser

  const value = useMemo(
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
      canAccess: (moduleId) => canAccessModule(cmsRole, moduleId),
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
