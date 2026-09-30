'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminServiceEditClient from '../AdminServiceEditClient'

/**
 * Phase 8: Service editor on Next.js — `/admin/services/:serviceId`.
 */
export default function AdminServiceEditPage() {
  return (
    <NextProtectedGate module="services">
      <NextAdminShell pageTitle="Edit service">
        <AdminServiceEditClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
