import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <LayoutDashboard size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-desc">
            {user?.email ? (
              <>
                Welcome back, <strong>{user.email}</strong>
              </>
            ) : (
              'Overview of your FlaireStack admin workspace.'
            )}
          </p>
        </div>
      </header>

      <div className="admin-dashboard-stats">
        {['Home', 'Services', 'Leads', 'Media'].map((label) => (
          <div key={label} className="admin-stat-card">
            <p className="admin-stat-label">{label}</p>
            <p className="admin-stat-value">—</p>
            <p className="admin-stat-hint">Metrics coming soon</p>
          </div>
        ))}
      </div>

      <div className="admin-page-placeholder">
        <p>Dashboard analytics and quick actions will appear here.</p>
      </div>
    </div>
  )
}
