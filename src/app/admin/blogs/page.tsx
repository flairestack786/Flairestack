'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminBlogsClient from './AdminBlogsClient'

export default function AdminBlogsPage() {
  return (
    <NextProtectedGate module="blogs">
      <NextAdminShell pageTitle="Blogs">
        <AdminBlogsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
