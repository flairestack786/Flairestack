import React from 'react'
import { Search } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminSeoPage() {
  return (
    <AdminPlaceholderPage
      title="SEO"
      description="Configure meta titles, descriptions, and search settings."
      icon={Search}
    />
  )
}
