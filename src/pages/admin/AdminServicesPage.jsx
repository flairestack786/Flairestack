import React from 'react'
import { Layers } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminServicesPage() {
  return (
    <AdminPlaceholderPage
      title="Services"
      description="Edit service pages, content blocks, and imagery."
      icon={Layers}
    />
  )
}
