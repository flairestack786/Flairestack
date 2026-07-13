import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminForbiddenPage() {
  const { cmsRole, profile } = useAuth()

  return (
    <div className="admin-page admin-forbidden-page">
      <div className="admin-forbidden-card">
        <span className="admin-forbidden-icon" aria-hidden>
          <ShieldX size={34} strokeWidth={1.5} />
        </span>
        <p className="admin-forbidden-code">403</p>
        <h1 className="admin-page-title">Access denied</h1>
        <p className="admin-page-desc">
          Your {String(profile?.role ?? cmsRole)} account does not have permission to view this
          module.
        </p>
        <div className="admin-forbidden-actions">
          <Link to="/admin/dashboard" className="admin-services-create-btn">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
