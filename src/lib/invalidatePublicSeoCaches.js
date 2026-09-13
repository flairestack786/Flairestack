import { clearHomePageCache } from '../hooks/useHomePage'
import { clearAboutPageCache } from '../hooks/useAboutPage'
import { clearPublicServiceCache } from '../hooks/useServicePage'
import { clearSiteSettingsCache } from '../hooks/useSiteSettings'

/**
 * Drop public-site SEO caches so CMS SEO saves appear on the next page load.
 * Clears page/service fetch caches and site_settings (global SEO inheritance).
 * When a service slug changes, pass `previousSlug` so the old URL is not served
 * from the in-memory public page cache.
 * @param {{ entityType?: string, slug?: string, previousSlug?: string }} [opts]
 */
export function invalidatePublicSeoCaches(opts = {}) {
  clearSiteSettingsCache()
  clearHomePageCache()
  clearAboutPageCache()
  const previousSlug = opts.previousSlug ? String(opts.previousSlug) : ''
  const nextSlug = opts.slug ? String(opts.slug) : ''
  if (opts.entityType === 'service' && previousSlug && nextSlug && previousSlug !== nextSlug) {
    // Slug rename: drop every per-page entry so no tab keeps the old URL.
    clearPublicServiceCache()
    return
  }
  if (opts.entityType === 'service' && (nextSlug || previousSlug)) {
    if (previousSlug) {
      clearPublicServiceCache(previousSlug)
    }
    if (nextSlug) {
      clearPublicServiceCache(nextSlug)
    }
    return
  }
  clearPublicServiceCache()
}
