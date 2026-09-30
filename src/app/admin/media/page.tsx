'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminMediaClient from './AdminMediaClient'

/**
 * Phase 6: CMS Media Library on Next.js.
 * Storage uses authenticated browser client against the existing `site-media` bucket.
 */
export default function AdminMediaPage() {
  return (
    <NextProtectedGate module="media">
      <NextAdminShell pageTitle="Media Library">
        <AdminMediaClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
