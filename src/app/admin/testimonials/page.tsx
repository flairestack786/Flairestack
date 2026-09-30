'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminTestimonialsClient from './AdminTestimonialsClient'

/**
 * Phase 10: Testimonials CMS list on Next.js.
 * Table: `testimonials` via browser client + existing RLS.
 */
export default function AdminTestimonialsPage() {
  return (
    <NextProtectedGate module="testimonials">
      <NextAdminShell pageTitle="Testimonials">
        <AdminTestimonialsClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
