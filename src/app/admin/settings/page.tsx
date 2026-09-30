'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminSettingsClient from './AdminSettingsClient'

/**
 * Phase 12: Settings CMS on Next.js.
 * Table: singleton `site_settings` via browser client + existing RLS.
 * Module access: administrator only (cmsPermissions).
 */
export default function AdminSettingsPage() {
  return (
    <NextProtectedGate module="settings">
      <NextAdminShell pageTitle="Settings">
        <AdminSettingsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
