import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/users'
import { canAccessModule, normalizeCmsRole } from '../lib/cmsPermissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

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

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!mounted) return
      setSession(current)
      setUser(current?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    refreshProfile()
  }, [user?.id, refreshProfile])

  const signIn = async (email, password) => {
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
      loading,
      profileLoading,
      refreshProfile,
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
      loading,
      profileLoading,
      refreshProfile,
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
