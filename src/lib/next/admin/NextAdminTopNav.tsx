'use client'

import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'
import NextAdminProfileMenu from '@/lib/next/admin/NextAdminProfileMenu'

type NextAdminTopNavProps = {
  onOpenMobile: () => void
  pageTitle?: string
}

export default function NextAdminTopNav({ onOpenMobile, pageTitle }: NextAdminTopNavProps) {
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
