import { services as staticServices } from '../data/services'
import { supabase } from './supabase'

/**
 * @typedef {{
 *   slug: string,
 *   title: string,
 *   shortDescription: string,
 *   description: string,
 *   icon: string,
 *   sortOrder: number,
 * }} PublicServiceListItem
 */

/**
 * Static listing fallback when the CMS request fails or returns nothing.
 * @type {PublicServiceListItem[]}
 */
export const FALLBACK_PUBLISHED_SERVICES = staticServices.map((service, index) => ({
  slug: service.slug,
  title: service.title,
  shortDescription: service.shortDescription ?? '',
  description: service.description ?? '',
  icon: service.icon ?? 'Layers',
  sortOrder: index,
}))

/**
 * @param {Record<string, unknown>} row
 * @returns {PublicServiceListItem}
 */
function mapServiceRow(row) {
  return {
    slug: String(row.slug ?? '').trim(),
    title: String(row.title ?? '').trim(),
    shortDescription: String(row.short_description ?? '').trim(),
    description: String(row.description ?? '').trim(),
    icon: String(row.icon_name ?? 'Layers').trim() || 'Layers',
    sortOrder: Number(row.sort_order ?? 0),
  }
}

/**
 * Fetch all published services for public listings (nav, home grid, footer).
 * Sorted by sort_order ascending.
 * @returns {Promise<PublicServiceListItem[] | null>}
 */
export async function fetchPublishedServicesList() {
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, title, short_description, description, icon_name, sort_order, status')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  return data.map(mapServiceRow).filter((service) => service.slug && service.title)
}

/**
 * @param {PublicServiceListItem[] | null} rows
 * @returns {PublicServiceListItem[]}
 */
export function buildPublishedServicesList(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return FALLBACK_PUBLISHED_SERVICES
  }
  return rows
}
