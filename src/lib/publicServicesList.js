import { services as staticServices } from '../data/services'
import { normalizeServiceSlug } from './serviceSlug'
import { buildPublishedServicesList } from './serviceUrlFlow'
import { supabase } from './supabase'

export { buildPublishedServicesList } from './serviceUrlFlow'

/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   title: string,
 *   shortDescription: string,
 *   description: string,
 *   icon: string,
 *   sortOrder: number,
 * }} PublicServiceListItem
 */

/**
 * Offline/static catalog. Not used for live public links — those come from
 * published `services.slug` rows so a CMS rename cannot keep old URLs around.
 * @type {PublicServiceListItem[]}
 */
export const FALLBACK_PUBLISHED_SERVICES = staticServices.map((service, index) => ({
  id: '',
  slug: normalizeServiceSlug(service.slug),
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
    id: String(row.id ?? ''),
    slug: normalizeServiceSlug(row.slug),
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
 * @returns {Promise<PublicServiceListItem[]>}
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

  return buildPublishedServicesList(Array.isArray(data) ? data.map(mapServiceRow) : [])
}
