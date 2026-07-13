import { getPublicUrl } from './media'
import { homeTestimonials } from '../data/homeTestimonials'
import { serviceTestimonials } from '../data/serviceTestimonials'
import { fetchPublishedTestimonials } from './testimonials'

/**
 * @param {string} name
 * @returns {string}
 */
export function initialsFromName(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{
 *   id: string,
 *   quote: string,
 *   author: string,
 *   role: string,
 *   company: string,
 *   position: string,
 *   initials: string,
 *   rating: number,
 *   photoUrl: string | null,
 *   companyLogoUrl: string | null,
 *   useBundledPhoto: boolean,
 *   stat: string,
 *   statLabel: string,
 *   featured: boolean,
 * }}
 */
export function mapTestimonialRow(row) {
  const name = String(row.name ?? '').trim()
  const company = String(row.company ?? '').trim()
  const position = String(row.position ?? '').trim()
  const role = [position, company].filter(Boolean).join(', ')
  const photoPath = String(row.photo_path ?? '').trim()
  const logoPath = String(row.company_logo_path ?? '').trim()

  return {
    id: String(row.id ?? name),
    quote: String(row.testimonial ?? '').trim(),
    author: name,
    role,
    company,
    position,
    initials: initialsFromName(name),
    rating: Number(row.rating) || 5,
    photoUrl: photoPath ? getPublicUrl(photoPath) : null,
    companyLogoUrl: logoPath ? getPublicUrl(logoPath) : null,
    useBundledPhoto: !photoPath,
    stat: String(row.stat ?? '').trim(),
    statLabel: String(row.stat_label ?? '').trim(),
    featured: Boolean(row.featured),
  }
}

/** @type {ReturnType<typeof mapTestimonialRow>[]} */
export const FALLBACK_HOME_TESTIMONIALS = homeTestimonials.map((item, index) => ({
  id: `home-fallback-${index}`,
  quote: item.quote,
  author: item.author,
  role: item.role,
  company: '',
  position: '',
  initials: item.initials,
  rating: 5,
  photoUrl: null,
  companyLogoUrl: null,
  useBundledPhoto: true,
  stat: '',
  statLabel: '',
  featured: true,
}))

/** @type {ReturnType<typeof mapTestimonialRow>[]} */
export const FALLBACK_SERVICE_TESTIMONIALS = serviceTestimonials.map((item, index) => ({
  id: `service-fallback-${index}`,
  quote: item.quote,
  author: item.author,
  role: item.role,
  company: '',
  position: '',
  initials: initialsFromName(item.author),
  rating: 5,
  photoUrl: null,
  companyLogoUrl: null,
  useBundledPhoto: true,
  stat: item.stat,
  statLabel: item.statLabel,
  featured: true,
}))

/**
 * @param {Record<string, unknown>[] | null} rows
 * @param {'home' | 'services'} [variant]
 * @returns {ReturnType<typeof mapTestimonialRow>[]}
 */
export function buildPublishedTestimonials(rows, variant = 'home') {
  if (!Array.isArray(rows) || rows.length === 0) {
    return variant === 'services' ? FALLBACK_SERVICE_TESTIMONIALS : FALLBACK_HOME_TESTIMONIALS
  }
  return rows.map(mapTestimonialRow).filter((item) => item.quote && item.author)
}

/**
 * @returns {Promise<ReturnType<typeof mapTestimonialRow>[]>}
 */
export async function loadPublishedTestimonials() {
  try {
    const rows = await fetchPublishedTestimonials()
    return buildPublishedTestimonials(rows, 'home')
  } catch {
    return FALLBACK_HOME_TESTIMONIALS
  }
}
