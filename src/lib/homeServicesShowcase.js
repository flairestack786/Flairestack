import { resolveServiceCardDescription, resolveServiceShowcaseCopy } from '@/data/serviceCardCopy'
import { normalizeServiceSlug } from '@/lib/serviceSlug'

/**
 * @typedef {{
 *   id?: string,
 *   enabled?: boolean,
 *   title?: string,
 *   accent?: string,
 *   description?: string,
 *   service_slug?: string,
 *   cta_label?: string,
 *   secondary_cta_label?: string,
 *   secondary_cta_url?: string,
 *   image_path?: string,
 *   image_alt?: string,
 *   highlights?: string[] | string,
 * }} HomeShowcaseItemInput
 */

/**
 * @returns {Required<Pick<HomeShowcaseItemInput,
 *   'enabled' | 'title' | 'accent' | 'description' | 'service_slug' |
 *   'cta_label' | 'secondary_cta_label' | 'secondary_cta_url' |
 *   'image_path' | 'image_alt'
 * >> & { id: string, highlights: string[] }}
 */
export function createEmptyShowcaseItem() {
  return {
    id: `showcase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    enabled: true,
    title: '',
    accent: '',
    description: '',
    service_slug: '',
    cta_label: 'Explore service',
    secondary_cta_label: 'Talk to us',
    secondary_cta_url: '/#contact',
    image_path: '',
    image_alt: '',
    highlights: [],
  }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeShowcaseHighlights(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 8)
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8)
  }
  return []
}

/**
 * @param {string[]} highlights
 * @returns {string}
 */
export function highlightsToEditorText(highlights) {
  return (Array.isArray(highlights) ? highlights : []).join('\n')
}

/**
 * @param {unknown} raw
 * @param {number} [index]
 */
export function normalizeShowcaseItem(raw, index = 0) {
  const source =
    raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  const title = String(source.title ?? '').trim()
  const slug = normalizeServiceSlug(String(source.service_slug ?? source.slug ?? ''))
  const showcase = resolveServiceShowcaseCopy(slug, title)
  const id =
    String(source.id ?? '').trim() ||
    `showcase-${index + 1}-${slug || 'item'}`

  return {
    id,
    enabled: source.enabled !== false && source.enabled !== 'false',
    title,
    accent: String(source.accent ?? '').trim() || showcase.accent,
    description: String(source.description ?? source.short_description ?? '').trim(),
    service_slug: slug,
    cta_label: String(source.cta_label ?? '').trim() || showcase.ctaLabel,
    secondary_cta_label: String(source.secondary_cta_label ?? '').trim() || 'Talk to us',
    secondary_cta_url: String(source.secondary_cta_url ?? '').trim() || '/#contact',
    image_path: String(source.image_path ?? '').trim(),
    image_alt: String(source.image_alt ?? '').trim(),
    highlights: (() => {
      const fromCms = normalizeShowcaseHighlights(source.highlights)
      return fromCms.length > 0 ? fromCms : showcase.highlights
    })(),
  }
}

/**
 * Prefill a showcase row from a published services catalog entry.
 * @param {Record<string, unknown>} service
 */
export function showcaseItemFromCatalogService(service) {
  const slug = normalizeServiceSlug(String(service.slug ?? ''))
  const title = String(service.title ?? '').trim() || 'Service'
  const showcase = resolveServiceShowcaseCopy(slug, title)
  const description = resolveServiceCardDescription(
    slug,
    String(service.short_description ?? ''),
    title
  )

  return {
    id: `catalog-${String(service.id ?? (slug || Date.now()))}`,
    enabled: true,
    title,
    accent: showcase.accent,
    description,
    service_slug: slug,
    cta_label: showcase.ctaLabel,
    secondary_cta_label: 'Talk to us',
    secondary_cta_url: '/#contact',
    image_path: '',
    image_alt: title,
    highlights: showcase.highlights,
  }
}

/**
 * @param {unknown} config
 * @returns {ReturnType<typeof normalizeShowcaseItem>[] | null}
 *   `null` means the CMS key was never set (use catalog fallback).
 */
export function readShowcaseItemsFromConfig(config) {
  if (!config || typeof config !== 'object') return null
  const source = /** @type {Record<string, unknown>} */ (config)
  if (!Object.prototype.hasOwnProperty.call(source, 'showcase_items')) return null
  const raw = source.showcase_items
  if (!Array.isArray(raw)) return []
  return raw.map((item, index) => normalizeShowcaseItem(item, index))
}
