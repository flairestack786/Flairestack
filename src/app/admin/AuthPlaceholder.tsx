'use client'

import Link from 'next/link'
import '@/admin-auth.css'

type AuthPlaceholderProps = {
  title: string
  subtitle: string
  badge?: string
}

/**
 * Temporary Next auth/CMS placeholder — not a completed CMS page.
 */
export function AuthPlaceholder({
  title,
  subtitle,
  badge = 'NEXT.JS PHASE 2 PLACEHOLDER',
}: AuthPlaceholderProps) {
  return (
    <div className="admin-auth-page">
      <div className="admin-auth-bg" aria-hidden>
        <div className="admin-auth-bg-grid" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--a" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--b" />
      </div>

      <div className="admin-auth-shell">
        <header className="admin-auth-brand">
          <Link href="/" className="admin-auth-logo">
            <span className="admin-auth-logo-text">FlaireStack</span>
            <span className="admin-auth-logo-accent" aria-hidden />
          </Link>
          <p className="admin-auth-badge">{badge}</p>
        </header>

        <div className="admin-auth-card">
          <h1 className="admin-auth-title">{title}</h1>
          <p className="admin-auth-subtitle">{subtitle}</p>
          <p className="admin-auth-footer" style={{ marginTop: '1.25rem' }}>
            <Link href="/admin/login" className="admin-auth-back">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
