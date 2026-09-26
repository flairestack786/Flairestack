'use client'

import { useRouter } from 'next/navigation'
import { useNextAuth } from '@/lib/next/NextAuthProvider'
import '@/admin-auth.css'

/**
 * Temporary recovery landing for Next.js.
 * Does not implement the reset form; keeps recovery sessions out of the CMS.
 */
export default function AdminResetPasswordPlaceholderPage() {
  const router = useRouter()
  const { session, isPasswordRecovery, loading, signOut, clearPasswordRecovery } = useNextAuth()

  const handleBackToLogin = async () => {
    try {
      await signOut()
    } catch {
      clearPasswordRecovery()
    }
    router.replace('/admin/login')
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-bg" aria-hidden>
        <div className="admin-auth-bg-grid" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--a" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--b" />
      </div>

      <div className="admin-auth-shell">
        <div className="admin-auth-card">
          <p className="admin-auth-badge" style={{ marginBottom: '1rem' }}>
            NEXT.JS PHASE 2 PLACEHOLDER
          </p>
          <h1 className="admin-auth-title">Reset password</h1>
          <p className="admin-auth-subtitle">
            {loading
              ? 'Checking recovery session…'
              : session && isPasswordRecovery
                ? 'A password-recovery session is active. The full reset form is not migrated yet — use the Vite app to change your password, or return to login (this signs you out).'
                : session
                  ? 'A session is present but not marked as recovery. Returning to login is required before CMS access.'
                  : 'No recovery session. Request a reset from the Vite app, or sign in normally.'}
          </p>
          <button type="button" className="admin-auth-submit" onClick={handleBackToLogin}>
            Back to login (sign out)
          </button>
        </div>
      </div>
    </div>
  )
}
