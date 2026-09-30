'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'
import type { PublicNavService } from '@/lib/next/publicSiteSettingsServer'

type PublicSiteContextValue = {
  settings: PublicSiteSettings
  services: PublicNavService[]
}

const PublicSiteContext = createContext<PublicSiteContextValue | null>(null)

export function PublicSiteProvider({
  settings,
  services,
  children,
}: {
  settings: PublicSiteSettings
  services: PublicNavService[]
  children: ReactNode
}) {
  return (
    <PublicSiteContext.Provider value={{ settings, services }}>{children}</PublicSiteContext.Provider>
  )
}

export function usePublicSite() {
  const ctx = useContext(PublicSiteContext)
  if (!ctx) {
    throw new Error('usePublicSite must be used within PublicSiteProvider')
  }
  return ctx
}
