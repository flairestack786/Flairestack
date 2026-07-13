import React from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Mail, PenLine, Shield, UserCheck, Users } from 'lucide-react'

/**
 * Compact team health panel for the dashboard.
 * @param {{
 *   team: {
 *     totalUsers?: number,
 *     activeUsers: number,
 *     pendingInvites: number,
 *     administrators: number,
 *     editors?: number,
 *     sales?: number,
 *     disabledUsers?: number,
 *   },
 * }} props
 */
export default function TeamOverviewCard({ team }) {
  const items = [
    {
      id: 'total',
      label: 'Total Users',
      value: team.totalUsers ?? 0,
      icon: <Users size={16} strokeWidth={1.75} />,
      variant: 'total',
    },
    {
      id: 'active',
      label: 'Active Users',
      value: team.activeUsers,
      icon: <UserCheck size={16} strokeWidth={1.75} />,
      variant: 'active',
    },
    {
      id: 'pending',
      label: 'Pending Invitations',
      value: team.pendingInvites,
      icon: <Mail size={16} strokeWidth={1.75} />,
      variant: 'pending',
    },
    {
      id: 'admins',
      label: 'Administrators',
      value: team.administrators,
      icon: <Shield size={16} strokeWidth={1.75} />,
      variant: 'admin',
    },
    {
      id: 'editors',
      label: 'Editors',
      value: team.editors ?? 0,
      icon: <PenLine size={16} strokeWidth={1.75} />,
      variant: 'editor',
    },
    {
      id: 'sales',
      label: 'Sales',
      value: team.sales ?? 0,
      icon: <Inbox size={16} strokeWidth={1.75} />,
      variant: 'sales',
    },
  ]

  return (
    <section className="admin-dashboard-card admin-dashboard-team-card">
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">Team Overview</h2>
          <p className="admin-dashboard-card-desc">Live CMS access and invite health.</p>
        </div>
        <Link to="/admin/users" className="admin-dashboard-card-link">
          Manage users
        </Link>
      </header>
      <div className="admin-dashboard-card-body">
        <ul className="admin-dashboard-team-grid">
          {items.map((item) => (
            <li
              key={item.id}
              className={`admin-dashboard-team-item admin-dashboard-team-item--${item.variant}`}
            >
              <span className="admin-dashboard-team-icon" aria-hidden>
                {item.icon}
              </span>
              <div>
                <p className="admin-dashboard-team-label">{item.label}</p>
                <p className="admin-dashboard-team-value">{item.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
