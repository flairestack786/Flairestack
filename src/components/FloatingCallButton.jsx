import React from 'react'
import { Phone } from 'lucide-react'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function FloatingCallButton() {
  const { settings } = useSiteSettings()
  const { company_name, phone, phoneTel } = settings

  return (
    <a
      href={phoneTel}
      className="floating-call-btn"
      aria-label={`Call ${company_name}`}
      title={`Call ${phone}`}
    >
      <span className="floating-call-btn-pulse" aria-hidden />
      <Phone size={28} strokeWidth={2.25} className="floating-call-btn-icon" aria-hidden />
    </a>
  )
}
