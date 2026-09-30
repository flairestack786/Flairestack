'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminUsersClient from './AdminUsersClient'

/**
 * Phase 5: CMS Users / RBAC management on Next.js.
 * Privileged mutations go through `/api/admin/*` Route Handlers (service-role server-side).
 */
export default function AdminUsersPage() {
  return (
    <NextProtectedGate module="users">
      <NextAdminShell pageTitle="Users">
        <AdminUsersClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
