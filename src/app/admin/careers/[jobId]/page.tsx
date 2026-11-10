'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminCareerEditClient from './AdminCareerEditClient'

export default function AdminCareerEditPage() {
  return (
    <NextProtectedGate module="careers">
      <NextAdminShell pageTitle="Edit Job Posting">
        <AdminCareerEditClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
