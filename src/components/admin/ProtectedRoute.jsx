import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminAuthLoading from './AdminAuthLoading'

/**
 * Session gate for the admin shell. Module access is enforced by PermissionRoute.
 */
export default function ProtectedRoute({ children }) {
  const { session, profile, isActiveCmsUser, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || profileLoading) {
    return <AdminAuthLoading />
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  if (profile && !isActiveCmsUser) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return children
}
