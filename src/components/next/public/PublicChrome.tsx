'use client'

import { Phone } from 'lucide-react'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import PublicFooter from './PublicFooter'
import PublicNavbar from './PublicNavbar'
import { usePublicSite } from './PublicSiteProvider'

function PublicFloatingCallButton() {
  const { settings } = usePublicSite()
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

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell app-shell--visible">
      <PublicNavbar />
      {children}
      <PublicFooter />
      <PublicFloatingCallButton />
      <ScrollToTopButton />
    </div>
  )
}
