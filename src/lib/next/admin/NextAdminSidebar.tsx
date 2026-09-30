'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getNavSectionsForRole } from '@/data/adminNav'
import { useNextAuth } from '@/lib/next/NextAuthProvider'

type NextAdminSidebarProps = {
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
}

export default function NextAdminSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: NextAdminSidebarProps) {
  const { canAccess, cmsRole } = useNextAuth()
  const pathname = usePathname() ?? ''
  const sections = getNavSectionsForRole(cmsRole, canAccess)

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-brand">
        <Link href="/admin/dashboard" className="admin-sidebar-logo" onClick={onNavigate}>
          <span className="admin-sidebar-logo-text">FlaireStack</span>
          <span className="admin-sidebar-logo-accent" aria-hidden />
        </Link>
        {!collapsed && <span className="admin-sidebar-badge">Admin</span>}
      </div>

      <nav className="admin-sidebar-nav">
        {sections.map((section) => (
          <div key={section.id} className="admin-sidebar-section">
            {!collapsed && (
              <p className="admin-sidebar-section-label" id={`admin-nav-${section.id}`}>
                {section.label}
              </p>
            )}
            <ul
              className="admin-sidebar-list"
              aria-labelledby={collapsed ? undefined : `admin-nav-${section.id}`}
            >
              {section.items
                .filter(
                  (item): item is NonNullable<(typeof section.items)[number]> => Boolean(item)
                )
                .map(({ id, label, path, icon: Icon }) => {
                const isActive = pathname === path || pathname.startsWith(`${path}/`)
                return (
                  <li key={id}>
                    <Link
                      href={path}
                      className={`admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`}
                      title={collapsed ? label : undefined}
                      onClick={onNavigate}
                    >
                      <Icon
                        size={20}
                        strokeWidth={1.75}
                        className="admin-sidebar-link-icon"
                        aria-hidden
                      />
                      <span className="admin-sidebar-link-label">{label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
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
