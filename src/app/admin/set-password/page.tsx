'use client'

import { AuthPlaceholder } from '../AuthPlaceholder'

/**
 * Temporary invite onboarding target for Next guest/protected redirects.
 * Full set-password form is not migrated in Phase 2.
 */
export default function AdminSetPasswordPlaceholderPage() {
  return (
    <AuthPlaceholder
      title="Set password (placeholder)"
      subtitle="Invite onboarding is not migrated to Next.js yet. Use the Vite app (npm run dev) to complete set-password. This route exists so auth redirects do not 404."
      badge="NEXT.JS PHASE 2 PLACEHOLDER"
    />
  )
}
