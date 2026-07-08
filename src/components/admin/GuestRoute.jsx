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
 */
export default function GuestRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <AdminAuthLoading />

  if (session) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
