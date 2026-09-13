/** Matches `services_slug_format` in phase1 core tables. */
export const SERVICE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** HTML `pattern` for slug inputs (full-string match). */
export const SERVICE_SLUG_INPUT_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*'

/**
 * Trim + lowercase. Used for public URL lookup so it stays aligned with
 * `useServicePage` / `fetchPublishedService`.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeServiceSlug(value) {
  return String(value ?? '').trim().toLowerCase()
}

/**
 * Normalize to the DB slug format: lowercase kebab-case.
 * A value that already matches the CHECK (`new-slug`) is unchanged.
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalizeServiceSlug(value) {
  return normalizeServiceSlug(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function assertValidServiceSlug(value) {
  const slug = canonicalizeServiceSlug(value)
  if (!slug || !SERVICE_SLUG_PATTERN.test(slug)) {
    throw new Error('Slug must be lowercase letters, numbers, and hyphens (e.g. web-development).')
  }
  return slug
}

/**
 * Public service URL from a CMS slug. Empty when the value is not a slug.
 * @param {unknown} value
 * @returns {string}
 */
export function publicServicePath(value) {
  const slug = canonicalizeServiceSlug(value)
  return slug ? `/services/${slug}` : ''
}
