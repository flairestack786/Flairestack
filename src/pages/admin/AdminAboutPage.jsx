import React from 'react'
import { Info } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminAboutPage() {
  return (
    <AdminPlaceholderPage
      title="About"
      description="Update the About page copy, team section, and visuals."
      icon={Info}
    />
  )
}
