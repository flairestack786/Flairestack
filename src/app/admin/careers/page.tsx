'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminCareersClient from './AdminCareersClient'

export default function AdminCareersPage() {
  return (
    <NextProtectedGate module="careers">
      <NextAdminShell pageTitle="Careers">
        <AdminCareersClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
