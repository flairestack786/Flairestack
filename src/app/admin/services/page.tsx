'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminServicesClient from './AdminServicesClient'

/**
 * Phase 8: Services CMS list on Next.js.
 * Tables: services, service_sections, service_media, media_assets, seo_metadata (on create).
 */
export default function AdminServicesPage() {
  return (
    <NextProtectedGate module="services">
      <NextAdminShell pageTitle="Services">
        <AdminServicesClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
