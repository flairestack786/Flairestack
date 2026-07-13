import { getSiteSettings } from './siteSettings'
import { seoToForm } from './seo'
import {
  mediaPathToUrl,
  resolveInheritedSeo,
} from './seoGlobals'
import { applyAnalyticsTags, applyDocumentSeo } from './documentSeo'

/**
 * Build document-head SEO payload from a CMS seo_metadata row + site settings.
 * @param {Record<string, unknown> | null | undefined} seoRow
 * @param {Record<string, unknown> | null | undefined} settings
 * @param {{
 *   pageTitle?: string,
 *   routePath?: string,
 *   entityType?: string,
 *   fallbackTitle?: string,
 *   fallbackDescription?: string,
 * }} [context]
 */
export function buildPublicDocumentSeo(seoRow, settings, context = {}) {
  const form = seoToForm(seoRow, {
    label: context.pageTitle || '',
    route_path: context.routePath || '/',
    entity_type: context.entityType || 'page',
  })

  const { resolved } = resolveInheritedSeo(form, settings ?? {}, {
    pageTitle: context.pageTitle || form.label,
    routePath: context.routePath || form.route_path,
    entityType: context.entityType,
  })

  const title =
    String(resolved.meta_title || '').trim() ||
    String(context.fallbackTitle || '').trim() ||
    String(settings?.default_meta_title || '').trim() ||
    'FlaireStack'

  const description =
    String(resolved.meta_description || '').trim() ||
    String(context.fallbackDescription || '').trim() ||
    String(settings?.default_meta_description || '').trim()

  const ogImage = mediaPathToUrl(resolved.og_image_path)
  const twitterImage = mediaPathToUrl(resolved.twitter_image_path) || ogImage

  let jsonLd = resolved.structured_data
  if (!jsonLd || (typeof jsonLd === 'object' && Object.keys(jsonLd).length === 0)) {
    const org = settings?.organization_jsonld
    const website = settings?.website_jsonld
    const parts = []
    if (org && typeof org === 'object' && Object.keys(org).length) parts.push(org)
    if (website && typeof website === 'object' && Object.keys(website).length) parts.push(website)
    jsonLd = parts.length === 1 ? parts[0] : parts.length > 1 ? parts : null
  }

  return {
    title,
    description,
    canonical: String(resolved.canonical_url || '').trim(),
    robots: String(resolved.robots || settings?.default_robots || 'index,follow').trim(),
    ogTitle: String(resolved.og_title || title).trim(),
    ogDescription: String(resolved.og_description || description).trim(),
    ogImage,
    ogType: String(resolved.og_type || 'website').trim(),
    twitterCard: String(resolved.twitter_card || 'summary_large_image').trim(),
    twitterTitle: String(resolved.twitter_title || resolved.og_title || title).trim(),
    twitterDescription: String(
      resolved.twitter_description || resolved.og_description || description
    ).trim(),
    twitterImage,
    jsonLd,
    gscVerification: String(settings?.gsc_verification || '').trim(),
    bingVerification: String(settings?.bing_verification || '').trim(),
    siteName: String(settings?.website_name || settings?.company_name || 'FlaireStack').trim(),
    pageDescription: String(resolved.page_description || '').trim(),
    focusKeyword: String(resolved.focus_keyword || '').trim(),
    relatedKeywords: Array.isArray(resolved.related_keywords) ? resolved.related_keywords : [],
  }
}

/** Full seo_metadata columns needed for public inheritance. */
export const PUBLIC_SEO_SELECT =
  'meta_title, meta_description, page_description, canonical_url, robots, og_title, og_description, og_type, og_image_id, twitter_card, twitter_title, twitter_description, twitter_image_id, structured_data, focus_keyword, related_keywords, extensions'

/**
 * Apply SEO + analytics for a public route. Returns cleanup.
 * @param {ReturnType<typeof buildPublicDocumentSeo>} documentSeo
 * @param {Record<string, unknown> | null | undefined} settings
 */
export function applyPublicSeo(documentSeo, settings) {
  const cleanup = applyDocumentSeo(documentSeo)
  if (settings) {
    applyAnalyticsTags({
      google_tag_manager_id: String(settings.google_tag_manager_id ?? ''),
      google_analytics_id: String(settings.google_analytics_id ?? ''),
      microsoft_clarity_id: String(settings.microsoft_clarity_id ?? ''),
      meta_pixel_id: String(settings.meta_pixel_id ?? ''),
    })
  }
  return cleanup
}

/**
 * Convenience: load site settings once and build document SEO.
 * @param {Record<string, unknown> | null | undefined} seoRow
 * @param {Parameters<typeof buildPublicDocumentSeo>[2]} context
 */
export async function resolvePublicSeo(seoRow, context = {}) {
  const settings = await getSiteSettings()
  return {
    settings,
    documentSeo: buildPublicDocumentSeo(seoRow, settings, context),
  }
}
