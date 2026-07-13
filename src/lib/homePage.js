import { supabase } from './supabase'

const HOME_SLUG = 'home'

/** Columns writable from the admin Home editor. */
const SECTION_WRITABLE_FIELDS = [
  'eyebrow',
  'title',
  'title_accent',
  'intro',
  'body',
  'cta_primary_label',
  'cta_primary_url',
  'cta_secondary_label',
  'cta_secondary_url',
  'icon_name',
  'config',
  'sort_order',
  'is_enabled',
]

const NULLABLE_TEXT_FIELDS = new Set([
  'eyebrow',
  'title',
  'title_accent',
  'intro',
  'body',
  'cta_primary_label',
  'cta_primary_url',
  'cta_secondary_label',
  'cta_secondary_url',
  'icon_name',
])

/**
 * @param {Record<string, unknown>} section
 * @returns {Record<string, unknown>}
 */
function sanitizeSectionPayload(section) {
  return Object.fromEntries(
    SECTION_WRITABLE_FIELDS.filter((key) => section[key] !== undefined).map((key) => {
      if (NULLABLE_TEXT_FIELDS.has(key)) {
        const value = section[key]
        return [key, value === '' || value == null ? null : value]
      }
      return [key, section[key]]
    })
  )
}

/**
 * Load the Home page and its ordered sections.
 * @returns {Promise<{ page: Record<string, unknown>, sections: Record<string, unknown>[] }>}
 */
export async function getHomePageWithSections() {
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', HOME_SLUG)
    .single()

  if (error) {
    throw error
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    throw sectionsError
  }

  return { page, sections: sections ?? [] }
}

/**
 * Persist one or more Home page sections by id.
 * @param {Record<string, unknown>[]} sections
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function saveHomeSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error('saveHomeSections requires at least one section.')
  }

  const results = await Promise.all(
    sections.map(async (section) => {
      if (!section?.id) {
        throw new Error('Each section must include an id.')
      }

      const payload = sanitizeSectionPayload(section)

      const { data, error } = await supabase
        .from('page_sections')
        .update(payload)
        .eq('id', section.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    })
  )

  return results
}
