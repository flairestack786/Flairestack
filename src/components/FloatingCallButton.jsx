import React from 'react'
import { Phone } from 'lucide-react'
import { PHONE_TEL } from '../config/contact'

export default function FloatingCallButton() {
  return (
    <a
      href={`tel:${PHONE_TEL}`}
      className="floating-call-btn"
      aria-label="Call FlaireStack"
      title={`Call ${PHONE_TEL}`}
    >
      <span className="floating-call-btn-pulse" aria-hidden />
      <Phone size={28} strokeWidth={2.25} className="floating-call-btn-icon" aria-hidden />
    </a>
  )
}
