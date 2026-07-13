import React, { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatCmsRole } from '../../lib/users'

/**
 * @param {string} name
 * @param {string} email
 */
function getInitials(name, email) {
  const fromName = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  if (fromName) return fromName
  if (email) return email.slice(0, 2).toUpperCase()
  return 'AD'
}

export default function AdminProfileMenu() {
  const { user, profile, cmsRole, canAccess, signOut } = useAuth()
  const navigate = useNavigate()
  const menuId = useId()
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const onDoc = (event) => {
      if (!rootRef.current?.contains(/** @type {Node} */ (event.target))) {
        setOpen(false)
      }
    }

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayName =
    String(profile?.full_name ?? '').trim() ||
    String(user?.user_metadata?.full_name ?? '').trim() ||
    String(user?.email ?? 'Admin')

  const email = String(profile?.email ?? user?.email ?? '')
  const roleLabel = formatCmsRole(String(profile?.role ?? cmsRole))
  const initials = getInitials(displayName.includes('@') ? '' : displayName, email)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`admin-profile-menu${open ? ' admin-profile-menu--open' : ''}`}
    >
      <button
        type="button"
        className="admin-profile-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="admin-topnav-avatar" aria-hidden>
          {initials}
        </span>
        <span className="admin-profile-menu-copy">
          <span className="admin-profile-menu-name">{displayName}</span>
          <span className="admin-profile-menu-role">{roleLabel}</span>
        </span>
        <ChevronDown size={15} strokeWidth={1.75} className="admin-profile-menu-chevron" aria-hidden />
      </button>

      {open && (
        <div id={menuId} role="menu" className="admin-profile-menu-dropdown">
          <div className="admin-profile-menu-summary">
            <p className="admin-profile-menu-summary-name">{displayName}</p>
            {email && <p className="admin-profile-menu-summary-email">{email}</p>}
            <p className="admin-profile-menu-summary-role">{roleLabel}</p>
          </div>

          {canAccess('users') && (
            <Link
              role="menuitem"
              to="/admin/users"
              className="admin-profile-menu-item"
              onClick={() => setOpen(false)}
            >
              <Users size={15} strokeWidth={1.75} aria-hidden />
              Users
            </Link>
          )}
          {canAccess('settings') && (
            <Link
              role="menuitem"
              to="/admin/settings"
              className="admin-profile-menu-item"
              onClick={() => setOpen(false)}
            >
              <Settings size={15} strokeWidth={1.75} aria-hidden />
              Settings
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className="admin-profile-menu-item admin-profile-menu-item--danger"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={15} strokeWidth={1.75} aria-hidden />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
