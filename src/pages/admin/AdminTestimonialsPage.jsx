import React from 'react'
import { MessageSquareQuote } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminTestimonialsPage() {
  return (
    <AdminPlaceholderPage
      title="Testimonials"
      description="Manage client testimonials shown across the website."
      icon={MessageSquareQuote}
    />
  )
}
