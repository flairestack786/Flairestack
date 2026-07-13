import React from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminAuthLoading() {
  return (
    <div className="admin-settings-state admin-auth-loading" role="status" aria-live="polite">
      <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
      <span>Checking access…</span>
    </div>
  )
}
