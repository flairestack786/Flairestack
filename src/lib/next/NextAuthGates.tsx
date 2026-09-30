'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNextAuth } from '@/lib/next/NextAuthProvider'
import { canAccessModule } from '@/lib/cmsPermissions'
import '@/admin-auth.css'

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

type NextProtectedGateProps = {
  children: React.ReactNode
  /** When set, enforces CMS module RBAC (Vite PermissionRoute equivalent). */
  module?: string
}

/**
 * Central protected-route gate for Next CMS pages.
 * - Unauthenticated → /admin/login
 * - Password recovery → /admin/reset-password (never CMS access)
 * - Invited → /admin/set-password
 * - Inactive CMS user → /admin/login
 * - Optional module RBAC → /admin/forbidden
 */
export function NextProtectedGate({ children, module }: NextProtectedGateProps) {
  const router = useRouter()
  const {
    session,
    profile,
    cmsRole,
    isActiveCmsUser,
    isPasswordRecovery,
    loading,
    profileLoading,
  } = useNextAuth()

  const missingProfile = Boolean(session) && !profile
  const moduleDenied =
    Boolean(module) &&
    Boolean(profile) &&
    isActiveCmsUser &&
    cmsRole != null &&
    !canAccessModule(cmsRole, module as never)

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
    // Never grant CMS access when profile is missing (no silent administrator fallback).
    if (!profile || !isActiveCmsUser) {
      router.replace('/admin/login')
      return
    }
    if (moduleDenied) {
      router.replace('/admin/forbidden')
    }
  }, [
    loading,
    profileLoading,
    session,
    profile,
    isActiveCmsUser,
    isPasswordRecovery,
    moduleDenied,
    router,
  ])

  if (loading || profileLoading) {
    return <AuthChecking label="Checking access…" />
  }

  if (!session || isPasswordRecovery || profile?.status === 'invited') {
    return <AuthChecking label="Redirecting…" />
  }

  if (missingProfile || !isActiveCmsUser) {
    return <AuthChecking label="Redirecting…" />
  }

  if (moduleDenied) {
    return <AuthChecking label="Redirecting…" />
  }

  return children
}
