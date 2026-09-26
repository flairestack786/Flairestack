import { AuthPlaceholder } from '../AuthPlaceholder'

/**
 * Placeholder so the login "Forgot password?" link does not 404.
 * Full forgot-password flow remains on Vite for now.
 */
export default function AdminForgotPasswordPlaceholderPage() {
  return (
    <AuthPlaceholder
      title="Forgot password (placeholder)"
      subtitle="Self-service password reset is not migrated to Next.js yet. Use the Vite admin app (npm run dev → /admin/forgot-password) to request a reset link."
    />
  )
}
