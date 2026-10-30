'use client'

import AdminThemeToggle from '@/lib/next/admin/AdminThemeToggle'
import { useAdminTheme } from '@/lib/next/admin/useAdminTheme'

/**
 * Applies the stored CMS theme on auth screens and keeps the same toggle.
 */
export default function AdminAuthTheme() {
  const { preference, setPreference } = useAdminTheme()

  return (
    <div className="admin-auth-theme">
      <AdminThemeToggle value={preference} onChange={setPreference} />
    </div>
  )
}
