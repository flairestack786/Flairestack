import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import '@/index.css'
import PublicAnalytics from '@/components/next/public/PublicAnalytics'
import PublicChrome from '@/components/next/public/PublicChrome'
import { PublicSiteProvider } from '@/components/next/public/PublicSiteProvider'
import { buildGlobalPublicMetadata } from '@/lib/next/publicMetadata'
import {
  getPublishedNavServices,
  getPublicSiteSettings,
} from '@/lib/next/publicSiteSettingsServer'

/** Soft revalidation so CMS settings updates appear without indefinite staleness. */
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  return buildGlobalPublicMetadata(settings)
}

/**
 * Phase 15 public shell — Header/Footer/nav + settings/SEO foundation.
 * Does not wrap `/admin/*` (sibling route segment).
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, services] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedNavServices(),
  ])

  return (
    <PublicSiteProvider settings={settings} services={services}>
      <PublicAnalytics settings={settings} />
      <PublicChrome>{children}</PublicChrome>
    </PublicSiteProvider>
  )
}
