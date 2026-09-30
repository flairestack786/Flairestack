'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminSeoClient from './AdminSeoClient'

/**
 * SEO CMS dashboard on Next.js.
 * Catalog + health via browser client (`seo_metadata`, pages, services) + existing RLS.
 */
export default function AdminSeoPage() {
  return (
    <NextProtectedGate module="seo">
      <NextAdminShell pageTitle="SEO">
        <AdminSeoClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
