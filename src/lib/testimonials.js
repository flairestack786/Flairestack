import { supabase } from './supabase'

const WRITABLE_FIELDS = [
  'name',
  'company',
  'position',
  'testimonial',
  'rating',
  'photo_path',
  'company_logo_path',
  'sort_order',
  'status',
  'featured',
  'stat',
  'stat_label',
  'published_at',
]

/**
 * @param {Record<string, unknown>} fields
 * @returns {Record<string, unknown>}
 */
function sanitizePayload(fields) {
  return Object.fromEntries(
    WRITABLE_FIELDS.filter((key) => fields[key] !== undefined).map((key) => {
      const value = fields[key]
      if (key === 'rating') {
        const rating = Number(value)
        return [key, Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5]
      }
      if (key === 'sort_order') {
        const order = Number(value)
        return [key, Number.isFinite(order) && order >= 0 ? Math.floor(order) : 0]
      }
      if (key === 'featured') {
        return [key, Boolean(value)]
      }
      if (key === 'published_at') {
        return [key, value || null]
      }
      if (
        typeof value === 'string' &&
        (key === 'photo_path' || key === 'company_logo_path' || key === 'stat' || key === 'stat_label')
      ) {
        return [key, value.trim() === '' ? null : value.trim()]
      }
      if (typeof value === 'string' && (key === 'company' || key === 'position')) {
        return [key, value.trim()]
      }
      if (typeof value === 'string') {
        return [key, value.trim()]
      }
      return [key, value]
    })
  )
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select(
      'id, name, company, position, testimonial, rating, photo_path, company_logo_path, sort_order, status, featured, stat, stat_label, published_at, updated_at'
    )
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} id
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getTestimonial(id) {
  const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).single()

  if (error) throw error
  return data
}

/**
 * @param {Partial<Record<string, unknown>>} input
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createTestimonial(input = {}) {
  const payload = sanitizePayload({
    name: input.name ?? 'New Testimonial',
    company: input.company ?? '',
    position: input.position ?? '',
    testimonial: input.testimonial ?? '',
    rating: input.rating ?? 5,
    sort_order: input.sort_order ?? 0,
    status: 'draft',
    featured: Boolean(input.featured),
    photo_path: input.photo_path ?? null,
    company_logo_path: input.company_logo_path ?? null,
    stat: input.stat ?? null,
    stat_label: input.stat_label ?? null,
  })

  const { data, error } = await supabase.from('testimonials').insert(payload).select().single()

  if (error) throw error
  return data
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} fields
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateTestimonial(id, fields) {
  const payload = sanitizePayload(fields)
  delete payload.status
  delete payload.published_at

  const { data, error } = await supabase
    .from('testimonials')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Testimonial update affected 0 rows (check RLS policies).')
  }
  return data
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTestimonial(id) {
  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) throw error
}

/**
 * @param {string} id
 * @param {'draft' | 'published'} status
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setTestimonialStatus(id, status) {
  if (status !== 'draft' && status !== 'published') {
    throw new Error(`Invalid testimonial status "${status}".`)
  }

  const published_at = status === 'published' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('testimonials')
    .update({ status, published_at })
    .eq('id', id)
    .select('id, name, status, published_at, sort_order, updated_at')
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Status update affected 0 rows (check RLS policies).')
  }
  return data
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function fetchPublishedTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select(
      'id, name, company, position, testimonial, rating, photo_path, company_logo_path, sort_order, featured, stat, stat_label'
    )
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}
