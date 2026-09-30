'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminSeoEditClient from '../../AdminSeoEditClient'

/**
 * Per-entity SEO editor on Next.js (`page` | `service` + entity id).
 */
export default function AdminSeoEditPage() {
  return (
    <NextProtectedGate module="seo">
      <NextAdminShell pageTitle="Edit SEO">
        <AdminSeoEditClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
