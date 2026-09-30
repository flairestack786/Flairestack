'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminHomeClient from './AdminHomeClient'

/**
 * Phase 7: Home Page CMS on Next.js.
 * Tables: `pages` (slug=home) + `page_sections` via browser client + existing RLS.
 */
export default function AdminHomePage() {
  return (
    <NextProtectedGate module="home">
      <NextAdminShell pageTitle="Home">
        <AdminHomeClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
