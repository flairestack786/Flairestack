'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminDashboardClient from './AdminDashboardClient'

/**
 * Phase 3: real CMS Dashboard on Next.js.
 * Auth + module RBAC are centralized in NextProtectedGate (reusable for later modules).
 */
export default function AdminDashboardPage() {
  return (
    <NextProtectedGate module="dashboard">
      <NextAdminShell pageTitle="Dashboard">
        <AdminDashboardClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
