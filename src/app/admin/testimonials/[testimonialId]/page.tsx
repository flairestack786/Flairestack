'use client'

import { NextProtectedGate } from '@/lib/next/NextAuthGates'
import NextAdminShell from '@/lib/next/admin/NextAdminShell'
import AdminTestimonialEditClient from '../AdminTestimonialEditClient'

/**
 * Phase 10: Testimonial editor — `/admin/testimonials/:testimonialId`.
 */
export default function AdminTestimonialEditPage() {
  return (
    <NextProtectedGate module="testimonials">
      <NextAdminShell pageTitle="Edit testimonial">
        <AdminTestimonialEditClient />
      </NextAdminShell>
    </NextProtectedGate>
  )
}
