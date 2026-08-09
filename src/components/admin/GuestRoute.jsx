import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminAuthLoading() {
  return (
    <div className="admin-auth-page" role="status" aria-live="polite">
      <div className="admin-auth-loading">
        <span className="admin-auth-spinner" aria-hidden />
        <span>Checking session…</span>
      </div>
    </div>
  )
}

/**
 * For login-only routes — sends authenticated users to the dashboard.
 * Invitees who have not finished onboarding go to set-password instead.
 */
export default function GuestRoute({ children }) {
  const { session, profile, loading, profileLoading } = useAuth()

  if (loading || (session && profileLoading)) return <AdminAuthLoading />

  if (session) {
    if (profile?.status === 'invited') {
      return <Navigate to="/admin/set-password" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
