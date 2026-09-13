import { canonicalizeServiceSlug, normalizeServiceSlug } from './serviceSlug.js'

/**
 * Immutable folder keys for bundled `/images/services/{key}/{slot}.webp`.
 * These are NOT public URL slugs and must not change when `services.slug` is edited.
 */
export const SERVICE_CATALOG_ASSET_KEYS = [
  'web-development',
  'software-development',
  'domain-hosting',
  'software-quality-assurance',
  'mobile-app-development',
  'it-consultancy',
  'database-development',
  'e-commerce-website-development',
  'cloud-strategy',
  'ai-development',
  'data-analytics',
  'business-process-services',
  'digital-marketing',
  'graphic-design',
  'ui-ux-design',
  'game-development',
]

const CATALOG_KEY_SET = new Set(SERVICE_CATALOG_ASSET_KEYS)

/** Exact catalog titles (lowercase) → immutable asset key. */
const CATALOG_TITLE_TO_KEY = {
  'web development': 'web-development',
  'software development': 'software-development',
  'domain hosting': 'domain-hosting',
  'software quality assurance': 'software-quality-assurance',
  'mobile app development': 'mobile-app-development',
  'it consultancy': 'it-consultancy',
  'database development': 'database-development',
  'e-commerce website development': 'e-commerce-website-development',
  'ecommerce website development': 'e-commerce-website-development',
  'cloud strategy': 'cloud-strategy',
  'artificial intelligence development services': 'ai-development',
  'data & analytics': 'data-analytics',
  'data and analytics': 'data-analytics',
  'business process services': 'business-process-services',
  'digital marketing': 'digital-marketing',
  'graphic design': 'graphic-design',
  'ui/ux design services': 'ui-ux-design',
  'ui ux design services': 'ui-ux-design',
  'game development services': 'game-development',
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function asCatalogAssetKey(value) {
  const key = normalizeServiceSlug(value)
  return CATALOG_KEY_SET.has(key) ? key : null
}

/**
 * Resolve the immutable bundled-asset pack for a CMS service.
 * Never uses the editable public URL slug unless that slug itself is still a catalog key.
 *
 * Priority:
 * 1. persisted `legacy_asset_key` (stable, keyed independently of slug)
 * 2. current slug, only if it is still a known catalog key
 * 3. catalog title match (recovers already-renamed rows before the key is stamped)
 *
 * @param {{
 *   legacy_asset_key?: unknown,
 *   slug?: unknown,
 *   title?: unknown,
 * } | null | undefined} serviceRow
 * @returns {string | null}
 */
export function resolveLegacyAssetKey(serviceRow) {
  if (!serviceRow || typeof serviceRow !== 'object') {
    return null
  }

  const persisted = asCatalogAssetKey(serviceRow.legacy_asset_key)
  if (persisted) {
    return persisted
  }

  const fromSlug = asCatalogAssetKey(serviceRow.slug)
  if (fromSlug) {
    return fromSlug
  }

  const title = String(serviceRow.title ?? '').trim().toLowerCase()
  if (title && CATALOG_TITLE_TO_KEY[title]) {
    return CATALOG_TITLE_TO_KEY[title]
  }

  const fromTitleSlug = asCatalogAssetKey(canonicalizeServiceSlug(serviceRow.title))
  return fromTitleSlug
}

/** Slots rendered as photos on the public service detail page. */
export const PUBLIC_CATALOG_IMAGE_SLOTS = [
  'hero',
  'overview',
  'banner',
  'framework1',
  'framework2',
  'framework3',
  'framework4',
  'framework5',
  'process',
  'clientBenefits',
  'businessOutcomes',
]

/**
 * Bundled public path for a catalog pack. Folder names are immutable asset keys.
 * @param {string} assetKey
 * @param {string} slot
 */
export function bundledServiceImageSrc(assetKey, slot) {
  return `/images/services/${assetKey}/${slot}.webp`
}

/**
 * Every catalog photo that the public service page can fall back to.
 * Empty when the CMS service has no catalog pack (new services).
 * @param {{
 *   legacy_asset_key?: unknown,
 *   slug?: unknown,
 *   title?: unknown,
 * } | null | undefined} serviceRow
 * @returns {string[]}
 */
export function catalogPageImageSrcs(serviceRow) {
  const key = resolveLegacyAssetKey(serviceRow)
  if (!key) {
    return []
  }
  return PUBLIC_CATALOG_IMAGE_SLOTS.map((slot) => bundledServiceImageSrc(key, slot))
}

/**
 * Stamp an immutable key once. Never overwrite a key that is already set.
 * @param {{
 *   legacy_asset_key?: unknown,
 *   slug?: unknown,
 *   title?: unknown,
 * } | null | undefined} existing
 * @param {{
 *   slug?: unknown,
 *   title?: unknown,
 *   legacy_asset_key?: unknown,
 * } | null | undefined} incoming
 * @returns {string | null}
 */
export function stampLegacyAssetKey(existing, incoming = {}) {
  const already = asCatalogAssetKey(existing?.legacy_asset_key)
  if (already) {
    return already
  }

  // Use the pre-rename identity first so a simultaneous slug edit still stamps the pack.
  return (
    resolveLegacyAssetKey({
      legacy_asset_key: incoming?.legacy_asset_key,
      slug: existing?.slug,
      title: existing?.title,
    }) ??
    resolveLegacyAssetKey({
      slug: incoming?.slug,
      title: incoming?.title,
    })
  )
}
