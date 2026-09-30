import { NextGuestGate } from '@/lib/next/NextAuthGates'
import AdminLoginClient from './AdminLoginClient'

export const metadata = {
  title: 'Sign in | FlaireStack Admin',
}

/**
 * Real Next /admin/login — ported from Vite AdminLogin.jsx.
 * Guest gate preserves recovery / invite redirects.
 */
export default function AdminLoginPage() {
  return (
    <NextGuestGate>
      <AdminLoginClient />
    </NextGuestGate>
  )
}
