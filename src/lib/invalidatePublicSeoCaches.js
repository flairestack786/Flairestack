import { clearHomePageCache } from '../hooks/useHomePage'
import { clearAboutPageCache } from '../hooks/useAboutPage'
import { clearPublicServiceCache } from '../hooks/useServicePage'
import { clearSiteSettingsCache } from '../hooks/useSiteSettings'

/**
 * Drop public-site SEO caches so CMS SEO saves appear on the next page load.
 * Clears page/service fetch caches and site_settings (global SEO inheritance).
 * @param {{ entityType?: string, slug?: string }} [opts]
 */
export function invalidatePublicSeoCaches(opts = {}) {
  clearSiteSettingsCache()
  clearHomePageCache()
  clearAboutPageCache()
  if (opts.entityType === 'service' && opts.slug) {
    clearPublicServiceCache(String(opts.slug))
    return
  }
  clearPublicServiceCache()
}
