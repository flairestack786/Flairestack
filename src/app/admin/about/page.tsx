'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminAboutClient from './AdminAboutClient'

/**
 * Phase 9: About Page CMS on Next.js.
 * Tables: `pages` (slug=about) + `page_sections` via browser client + existing RLS.
 */
export default function AdminAboutPage() {
  return (
    <NextProtectedGate module="about">
      <NextAdminShell pageTitle="About">
        <AdminAboutClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
