import React from 'react'
import { Image } from 'lucide-react'
import AdminPlaceholderPage from '../../components/admin/AdminPlaceholderPage'

export default function AdminMediaPage() {
  return (
    <AdminPlaceholderPage
      title="Media Library"
      description="Upload and organize images, videos, and other assets."
      icon={Image}
    />
  )
}
