import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminAuthLoading() {
  return (
    <div className="admin-auth-page" role="status" aria-live="polite">
      <div className="admin-auth-loading">
        <span className="admin-auth-spinner" aria-hidden />
        <span>Verifying session…</span>
      </div>
    </div>
  )
}

/**
 * Redirects unauthenticated users to /admin/login.
 * Preserves the attempted URL in location state for optional post-login redirect.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AdminAuthLoading />

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return children
}
