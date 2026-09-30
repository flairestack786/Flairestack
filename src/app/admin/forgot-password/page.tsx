import { NextGuestGate } from '@/lib/next/NextAuthGates'
import AdminForgotPasswordClient from './AdminForgotPasswordClient'

export const metadata = {
  title: 'Forgot password | FlaireStack Admin',
}

/**
 * Phase 14: full forgot-password flow (replaces placeholder).
 */
export default function AdminForgotPasswordPage() {
  return (
    <NextGuestGate>
      <AdminForgotPasswordClient />
    </NextGuestGate>
  )
}
