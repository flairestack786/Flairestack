import type { MetadataRoute } from 'next'
import { SITEMAP_SITE_ORIGIN } from '@/lib/publicSitemap'

/**
 * Public robots.txt — allow marketing pages, block admin/API, point to sitemap.
 * Does not disallow `/_next`, CSS, JS, or image assets needed to render the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${SITEMAP_SITE_ORIGIN}/sitemap.xml`,
    host: SITEMAP_SITE_ORIGIN,
  }
}
