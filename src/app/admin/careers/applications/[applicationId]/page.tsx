'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminApplicationDetailClient from './AdminApplicationDetailClient'

export default function AdminApplicationDetailPage() {
  return (
    <NextProtectedGate module="careers">
      <NextAdminShell pageTitle="Application">
        <AdminApplicationDetailClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
