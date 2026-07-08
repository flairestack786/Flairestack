import React from 'react'
import { Home } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminHomePage() {
  return (
    <AdminPlaceholderPage
      title="Home"
      description="Manage hero content, sections, and homepage settings."
      icon={Home}
    />
  )
}
