'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminSeoGlobalClient from './AdminSeoGlobalClient'

/**
 * Global SEO defaults on Next.js (administrators / global SEO managers).
 */
export default function AdminSeoGlobalPage() {
  return (
    <NextProtectedGate module="seo">
      <NextAdminShell pageTitle="Global SEO">
        <AdminSeoGlobalClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
