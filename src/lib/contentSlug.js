/**
 * Shared kebab-case slug helpers for Blog / Careers (same rules as services).
 */

import {
  SERVICE_SLUG_INPUT_PATTERN,
  SERVICE_SLUG_PATTERN,
  assertValidServiceSlug,
  canonicalizeServiceSlug,
  normalizeServiceSlug,
} from './serviceSlug.js'

export const CONTENT_SLUG_PATTERN = SERVICE_SLUG_PATTERN
export const CONTENT_SLUG_INPUT_PATTERN = SERVICE_SLUG_INPUT_PATTERN
export const normalizeContentSlug = normalizeServiceSlug
export const canonicalizeContentSlug = canonicalizeServiceSlug
export const assertValidContentSlug = assertValidServiceSlug

/**
 * @param {unknown} value
 * @returns {string}
 */
export function publicBlogPath(value) {
  const slug = canonicalizeContentSlug(value)
  return slug ? `/blog/${slug}` : ''
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function publicCareerPath(value) {
  const slug = canonicalizeContentSlug(value)
  return slug ? `/careers/${slug}` : ''
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function publicCareerApplyPath(value) {
  const path = publicCareerPath(value)
  return path ? `${path}/apply` : ''
}
