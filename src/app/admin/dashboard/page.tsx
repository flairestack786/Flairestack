'use client'

import Link from 'next/link'
import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import { useNextAuth } from '@/lib/next/NextAuthProvider'
import '@/admin-auth.css'

function DashboardPlaceholder() {
  const { profile, cmsRole, signOut } = useNextAuth()

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-bg" aria-hidden>
        <div className="admin-auth-bg-grid" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--a" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--b" />
      </div>

      <div className="admin-auth-shell" style={{ maxWidth: '32rem' }}>
        <header className="admin-auth-brand">
          <Link href="/" className="admin-auth-logo">
            <span className="admin-auth-logo-text">FlaireStack</span>
            <span className="admin-auth-logo-accent" aria-hidden />
          </Link>
          <p className="admin-auth-badge">NEXT.JS PHASE 2 PLACEHOLDER</p>
        </header>

        <div className="admin-auth-card">
          <h1 className="admin-auth-title">Protected dashboard</h1>
          <p className="admin-auth-subtitle">
            Temporary Next.js placeholder only. CMS modules are not migrated yet. Role:{' '}
            <strong>{cmsRole}</strong>
            {profile?.email ? (
              <>
                {' '}
                · {String(profile.email)}
              </>
            ) : null}
          </p>
          <button
            type="button"
            className="admin-auth-submit"
            onClick={async () => {
              await signOut()
              window.location.replace('/admin/login')
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Temporary protected landing after a normal Next login.
 * Does not grant CMS module access.
 */
export default function AdminDashboardPlaceholderPage() {
  return (
    <NextProtectedGate>
      <DashboardPlaceholder />
    </NextProtectedGate>
  )
}
