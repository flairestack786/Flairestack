'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminIdleSignOut from '@/lib/next/admin/AdminIdleSignOut'
import NextAdminSidebar from '@/lib/next/admin/NextAdminSidebar'
import NextAdminTopNav from '@/lib/next/admin/NextAdminTopNav'
import { useAdminTheme } from '@/lib/next/admin/useAdminTheme'
import { ToastProvider } from '@/components/common/ToastProvider'
import { MediaUrlContext } from '@/components/admin/MediaUrlContext'
import { adminNavItems } from '@/data/adminNav'
import { getPublicUrl } from '@/lib/next/mediaBrowser'
import '@/admin-dashboard.css'

type NextAdminShellProps = {
  children: ReactNode
  /** Optional override; defaults to matching adminNav by pathname. */
  pageTitle?: string
}

/**
 * Reusable Next CMS chrome (sidebar + topnav + toast).
 * Wrap module pages after NextProtectedGate — same pattern for later CMS modules.
 */
export default function NextAdminShell({ children, pageTitle }: NextAdminShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { preference: themePreference, resolved: resolvedTheme, setPreference: setTheme } =
    useAdminTheme()

  const path = pathname ?? ''
  const resolvedTitle =
    pageTitle ??
    adminNavItems.find(
      (item) => path === item.path || path.startsWith(`${item.path}/`)
    )?.label ??
    'Admin'

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <ToastProvider>
      <MediaUrlContext.Provider value={getPublicUrl}>
        <div
          className={[
            'admin-shell',
            collapsed ? 'admin-shell--collapsed' : '',
            mobileOpen ? 'admin-shell--mobile-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-theme={resolvedTheme}
          data-theme-pref={themePreference}
        >
          {mobileOpen && (
            <button
              type="button"
              className="admin-sidebar-backdrop"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            />
          )}

          <NextAdminSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onNavigate={() => setMobileOpen(false)}
          />

          <div className="admin-main">
            <NextAdminTopNav
              pageTitle={resolvedTitle}
              onOpenMobile={() => setMobileOpen(true)}
              themePreference={themePreference}
              onThemeChange={setTheme}
            />
            <div className="admin-content">{children}</div>
          </div>
          <AdminIdleSignOut />
        </div>
      </MediaUrlContext.Provider>
    </ToastProvider>
  )
}
