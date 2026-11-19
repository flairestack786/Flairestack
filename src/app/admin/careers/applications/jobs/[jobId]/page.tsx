'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminJobApplicantsClient from './AdminJobApplicantsClient'

export default function AdminJobApplicantsPage() {
  return (
    <NextProtectedGate module="careers">
      <NextAdminShell pageTitle="Applicants">
        <AdminJobApplicantsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
