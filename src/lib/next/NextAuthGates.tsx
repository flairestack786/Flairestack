'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNextAuth } from '@/lib/next/NextAuthProvider'

function AuthChecking({ label = 'Checking session…' }: { label?: string }) {
  return (
    <div className="admin-auth-page" role="status" aria-live="polite">
      <div className="admin-auth-loading">
        <span className="admin-auth-spinner" aria-hidden />
        <span>{label}</span>
      </div>
    </div>
  )
}

/**
 * Next equivalent of Vite GuestRoute for auth-entry pages (login).
 * Recovery sessions never go to the dashboard.
 */
export function NextGuestGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, profile, isPasswordRecovery, loading, profileLoading } = useNextAuth()

  useEffect(() => {
    if (loading || (session && profileLoading)) return
    if (!session) return

    if (isPasswordRecovery) {
      router.replace('/admin/reset-password')
      return
    }
    if (profile?.status === 'invited') {
      router.replace('/admin/set-password')
      return
    }
    router.replace('/admin/dashboard')
  }, [loading, profileLoading, session, profile, isPasswordRecovery, router])

  if (loading || (session && profileLoading)) {
    return <AuthChecking />
  }

  if (session) {
    return <AuthChecking label="Redirecting…" />
  }

  return children
}

/**
 * Next equivalent of Vite ProtectedRoute for temporary protected placeholders.
 * Recovery sessions are forced to /admin/reset-password.
 */
export function NextProtectedGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, profile, isActiveCmsUser, isPasswordRecovery, loading, profileLoading } =
    useNextAuth()

  useEffect(() => {
    if (loading || profileLoading) return

    if (!session) {
      router.replace('/admin/login')
      return
    }
    if (isPasswordRecovery) {
      router.replace('/admin/reset-password')
      return
    }
    if (profile?.status === 'invited') {
      router.replace('/admin/set-password')
      return
    }
    if (profile && !isActiveCmsUser) {
      router.replace('/admin/login')
    }
  }, [
    loading,
    profileLoading,
    session,
    profile,
    isActiveCmsUser,
    isPasswordRecovery,
    router,
  ])

  if (loading || profileLoading) {
    return <AuthChecking label="Checking access…" />
  }

  if (!session || isPasswordRecovery || profile?.status === 'invited') {
    return <AuthChecking label="Redirecting…" />
  }

  if (profile && !isActiveCmsUser) {
    return <AuthChecking label="Redirecting…" />
  }

  return children
}
