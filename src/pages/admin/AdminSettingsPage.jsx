import React from 'react'
import { Settings } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      title="Settings"
      description="Site-wide preferences, integrations, and admin configuration."
      icon={Settings}
    />
  )
}
