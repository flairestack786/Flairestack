'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminLeadsClient from './AdminLeadsClient'

/**
 * Phase 4: CMS Leads / CRM on Next.js.
 * Reuses NextProtectedGate + NextAdminShell from Phase 3.
 */
export default function AdminLeadsPage() {
  return (
    <NextProtectedGate module="leads">
      <NextAdminShell pageTitle="Leads">
        <AdminLeadsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
