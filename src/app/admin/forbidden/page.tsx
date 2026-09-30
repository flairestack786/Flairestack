'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import { useNextAuth } from '@/lib/next/NextAuthProvider'
import '@/admin-dashboard.css'

function ForbiddenBody() {
  const { cmsRole, profile } = useNextAuth()

  return (
    <div className="admin-page admin-forbidden-page">
      <div className="admin-forbidden-card">
        <span className="admin-forbidden-icon" aria-hidden>
          <ShieldX size={34} strokeWidth={1.5} />
        </span>
        <p className="admin-forbidden-code">403</p>
        <h1 className="admin-page-title">Access denied</h1>
        <p className="admin-page-desc">
          Your {String(profile?.role ?? cmsRole)} account does not have permission to view this
          module.
        </p>
        <div className="admin-forbidden-actions">
          <Link href="/admin/dashboard" className="admin-services-create-btn">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Next equivalent of Vite AdminForbiddenPage.
 * Authenticated shell only — recovery sessions never reach here via NextProtectedGate.
 */
export default function AdminForbiddenPage() {
  return (
    <NextProtectedGate>
      <NextAdminShell pageTitle="Access denied">
        <ForbiddenBody />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
