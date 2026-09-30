import Link from 'next/link'
import '@/index.css'
import PublicAnalytics from '@/components/next/public/PublicAnalytics'
import PublicChrome from '@/components/next/public/PublicChrome'
import { PublicSiteProvider } from '@/components/next/public/PublicSiteProvider'
import {
  getPublishedNavServices,
  getPublicSiteSettings,
} from '@/lib/next/publicSiteSettingsServer'

/**
 * Root 404 — unmatched URLs outside nested layouts still get the public shell.
 */
export default async function RootNotFound() {
  const [settings, services] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedNavServices(),
  ])

  return (
    <PublicSiteProvider settings={settings} services={services}>
      <PublicAnalytics settings={settings} />
      <PublicChrome>
        <main className="public-phase15-main">
          <div className="public-phase15-panel">
            <p className="public-phase15-eyebrow">404</p>
            <h1 className="public-phase15-title">Page not found</h1>
            <p className="public-phase15-copy">
              That page does not exist yet on the Next.js public site, or the link is incorrect.
            </p>
            <p className="public-phase15-actions">
              <Link href="/" className="public-phase15-link">
                Back to home
              </Link>
            </p>
          </div>
        </main>
      </PublicChrome>
    </PublicSiteProvider>
  )
}
