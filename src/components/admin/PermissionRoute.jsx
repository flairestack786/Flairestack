import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccessModule } from '../../lib/cmsPermissions'
import AdminAuthLoading from './AdminAuthLoading'

/**
 * Ensures authenticated CMS users can only access modules allowed by their role.
 * @param {{ module: string, children: React.ReactNode }} props
 */
export default function PermissionRoute({ module, children }) {
  const { session, profile, cmsRole, isActiveCmsUser, loading, profileLoading } = useAuth()
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

  if (!canAccessModule(cmsRole, module)) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return children
}
