'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminBlogEditClient from './AdminBlogEditClient'

export default function AdminBlogEditPage() {
  return (
    <NextProtectedGate module="blogs">
      <NextAdminShell pageTitle="Edit Blog Post">
        <AdminBlogEditClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
