import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { adminNavItems } from '../../data/adminNav'

export default function AdminSidebar({ collapsed, onToggleCollapse, onNavigate }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-brand">
        <NavLink to="/admin/dashboard" className="admin-sidebar-logo" onClick={onNavigate}>
          <span className="admin-sidebar-logo-text">FlaireStack</span>
          <span className="admin-sidebar-logo-accent" aria-hidden />
        </NavLink>
        {!collapsed && <span className="admin-sidebar-badge">Admin</span>}
      </div>

      <nav className="admin-sidebar-nav">
        <ul className="admin-sidebar-list">
          {adminNavItems.map(({ id, label, path, icon: Icon }) => (
            <li key={id}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`
                }
                title={collapsed ? label : undefined}
                onClick={onNavigate}
              >
                <Icon size={20} strokeWidth={1.75} className="admin-sidebar-link-icon" aria-hidden />
                <span className="admin-sidebar-link-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className="admin-sidebar-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        <span className="admin-sidebar-collapse-label">Collapse</span>
      </button>
    </aside>
  )
}
