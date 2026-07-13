import React from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Menu } from 'lucide-react'
import AdminProfileMenu from './AdminProfileMenu'

export default function AdminTopNav({ onOpenMobile, pageTitle }) {
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
        <Link to="/" className="admin-topnav-site-link" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden />
          <span>View site</span>
        </Link>

        <AdminProfileMenu />
      </div>
    </header>
  )
}
