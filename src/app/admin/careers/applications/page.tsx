'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminApplicationsClient from './AdminApplicationsClient'

export default function AdminApplicationsPage() {
  return (
    <NextProtectedGate module="careers">
      <NextAdminShell pageTitle="Job Applications">
        <AdminApplicationsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
