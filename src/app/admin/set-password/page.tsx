import AdminSetPasswordClient from './AdminSetPasswordClient'

export const metadata = {
  title: 'Set password | FlaireStack Admin',
}

/**
 * Phase 14: invite onboarding (replaces placeholder).
 * Not wrapped in GuestGate — invitees already have a session from the email link.
 */
export default function AdminSetPasswordPage() {
  return <AdminSetPasswordClient />
}
