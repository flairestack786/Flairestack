import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopNav from './AdminTopNav'
import { ToastProvider } from '../common/ToastProvider'
import { adminNavItems } from '../../data/adminNav'
import '../../admin-dashboard.css'

export default function AdminLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pageTitle = useMemo(() => {
    const match = adminNavItems.find(
      (item) =>
        location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    )
    return match?.label ?? 'Admin'
  }, [location.pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const onKey = (e) => {
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
      <div
        className={[
          'admin-shell',
          collapsed ? 'admin-shell--collapsed' : '',
          mobileOpen ? 'admin-shell--mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="admin-main">
        <AdminTopNav pageTitle={pageTitle} onOpenMobile={() => setMobileOpen(true)} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
      </div>
    </ToastProvider>
  )
}
