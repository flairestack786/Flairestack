import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminTopNav({ onOpenMobile, pageTitle }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch {
      setSigningOut(false)
    }
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

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

        <div className="admin-topnav-user">
          <span className="admin-topnav-avatar" aria-hidden>
            {initials}
          </span>
          <span className="admin-topnav-email">{user?.email ?? 'Admin'}</span>
        </div>

        <button
          type="button"
          className="admin-topnav-logout"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden />
          <span className="admin-topnav-logout-label">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  )
}
