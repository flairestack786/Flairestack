'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings, Users } from 'lucide-react'
import { useNextAuth } from '@/lib/next/NextAuthProvider'

function formatCmsRole(role: string) {
  return String(role ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getInitials(name: string, email: string) {
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

export default function NextAdminProfileMenu() {
  const { user, profile, cmsRole, canAccess, signOut } = useNextAuth()
  const router = useRouter()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKey = (event: KeyboardEvent) => {
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
      router.replace('/admin/login')
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
        <ChevronDown
          size={15}
          strokeWidth={1.75}
          className="admin-profile-menu-chevron"
          aria-hidden
        />
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
              href="/admin/users"
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
              href="/admin/settings"
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
