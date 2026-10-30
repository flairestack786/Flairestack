'use client'

import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'
import NextAdminProfileMenu from '@/lib/next/admin/NextAdminProfileMenu'
import AdminThemeToggle from '@/lib/next/admin/AdminThemeToggle'
import type { AdminThemePreference } from '@/lib/next/admin/adminTheme'

type NextAdminTopNavProps = {
  onOpenMobile: () => void
  pageTitle?: string
  themePreference: AdminThemePreference
  onThemeChange: (next: AdminThemePreference) => void
}

export default function NextAdminTopNav({
  onOpenMobile,
  pageTitle,
  themePreference,
  onThemeChange,
}: NextAdminTopNavProps) {
  return (
    <header className="admin-topnav">
      <div className="admin-topnav-left">
        <button
          type="button"
          className="admin-topnav-menu"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        {pageTitle && <h1 className="admin-topnav-title">{pageTitle}</h1>}
      </div>

      <div className="admin-topnav-right">
        <AdminThemeToggle value={themePreference} onChange={onThemeChange} />

        <Link
          href="/"
          className="admin-topnav-site-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} aria-hidden />
          <span>View site</span>
        </Link>

        <NextAdminProfileMenu />
      </div>
    </header>
  )
}
