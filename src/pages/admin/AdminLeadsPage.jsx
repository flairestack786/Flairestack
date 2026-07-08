import React from 'react'
import { Inbox } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminLeadsPage() {
  return (
    <AdminPlaceholderPage
      title="Leads"
      description="Review and manage contact form submissions and inquiries."
      icon={Inbox}
    />
  )
}
