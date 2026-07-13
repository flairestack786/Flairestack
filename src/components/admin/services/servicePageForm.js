import { SERVICE_SECTION_KEYS } from '../../../lib/serviceDefaults'
import { SERVICE_MEDIA_SLOTS } from '../../../lib/servicePage'

export { SERVICE_SECTION_KEYS as SERVICE_EDITOR_SECTION_KEYS, SERVICE_MEDIA_SLOTS }

export {
  formsAreEqual,
  updateSectionField,
  updateSectionConfig,
} from '../home/homePageForm'

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function sectionToForm(row) {
  return {
    id: row.id,
    section_key: row.section_key,
    eyebrow: row.eyebrow ?? '',
    title: row.title ?? '',
    intro: row.intro ?? '',
    body: row.body ?? '',
    cta_label: row.cta_label ?? '',
    cta_url: row.cta_url ?? '',
    secondary_cta_label: row.secondary_cta_label ?? '',
    secondary_cta_url: row.secondary_cta_url ?? '',
    use_global_template: row.use_global_template ?? false,
    global_template_key: row.global_template_key ?? '',
    config: structuredClone(row.config ?? {}),
    is_enabled: row.is_enabled ?? true,
  }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function serviceToForm(row) {
  return {
    id: row.id,
    slug: row.slug ?? '',
    title: row.title ?? '',
    short_description: row.short_description ?? '',
    description: row.description ?? '',
    icon_name: row.icon_name ?? '',
    sort_order: row.sort_order ?? 0,
    status: row.status ?? 'draft',
    published_at: row.published_at ?? null,
  }
}

/**
 * @param {Record<string, unknown> | null} row
 * @param {string} serviceId
 * @returns {Record<string, unknown>}
 */
export function seoToForm(row, serviceId) {
  if (!row) {
    return {
      id: '',
      service_id: serviceId,
      meta_title: '',
      meta_description: '',
      canonical_url: '',
      robots: 'index,follow',
      og_title: '',
      og_description: '',
      twitter_title: '',
      twitter_description: '',
      status: 'draft',
      published_at: null,
    }
  }

  return {
    id: row.id,
    service_id: row.service_id ?? serviceId,
    meta_title: row.meta_title ?? '',
    meta_description: row.meta_description ?? '',
    canonical_url: row.canonical_url ?? '',
    robots: row.robots ?? 'index,follow',
    og_title: row.og_title ?? '',
    og_description: row.og_description ?? '',
    twitter_title: row.twitter_title ?? '',
    twitter_description: row.twitter_description ?? '',
    status: row.status ?? 'draft',
    published_at: row.published_at ?? null,
  }
}

/**
 * @param {Record<string, unknown>[]} mediaRows
 * @returns {Record<string, Record<string, unknown>>}
 */
export function mediaRowsToForm(mediaRows) {
  const map = Object.fromEntries(
    SERVICE_MEDIA_SLOTS.map(({ slot }) => [
      slot,
      { slot, id: '', media_id: '', storage_path: '', alt_override: '' },
    ])
  )

  for (const row of mediaRows) {
    const slot = row.slot
    if (!slot) continue
    const asset = row.media_assets ?? {}
    map[slot] = {
      id: row.id ?? '',
      slot,
      media_id: row.media_id ?? asset.id ?? '',
      storage_path: asset.storage_path ?? '',
      alt_override: row.alt_override ?? '',
    }
  }

  return map
}

/**
 * @param {Record<string, unknown>} service
 * @param {Record<string, unknown>[]} sections
 * @param {Record<string, unknown>[]} mediaRows
 * @param {Record<string, unknown> | null} seo
 * @returns {{ service: Record<string, unknown>, sections: Record<string, Record<string, unknown>>, media: Record<string, Record<string, unknown>>, seo: Record<string, unknown> }}
 */
export function serviceDataToForm(service, sections, mediaRows, seo) {
  const sectionMap = Object.fromEntries(
    sections
      .filter((row) => SERVICE_SECTION_KEYS.includes(row.section_key))
      .map((row) => [row.section_key, sectionToForm(row)])
  )

  for (const key of SERVICE_SECTION_KEYS) {
    if (!sectionMap[key]) {
      sectionMap[key] = sectionToForm({ section_key: key, config: {} })
    }
  }

  return {
    service: serviceToForm(service),
    sections: sectionMap,
    media: mediaRowsToForm(mediaRows),
    seo: seoToForm(seo, service.id),
  }
}

/**
 * @param {{ sections: Record<string, Record<string, unknown>> }} form
 * @returns {Record<string, unknown>[]}
 */
export function formToSectionPayloads(form) {
  return SERVICE_SECTION_KEYS.map((key) => form.sections[key]).filter((section) => section?.id)
}

/**
 * @param {{ service: Record<string, unknown> }} form
 * @returns {Record<string, unknown>}
 */
export function formToServicePayload(form) {
  return form.service
}

/**
 * @param {{ media: Record<string, Record<string, unknown>> }} form
 * @returns {Array<{ slot: string, storage_path?: string, alt_override?: string }>}
 */
export function formToMediaPayloads(form) {
  return SERVICE_MEDIA_SLOTS.map(({ slot }) => {
    const entry = form.media[slot] ?? {}
    return {
      slot,
      storage_path: typeof entry.storage_path === 'string' ? entry.storage_path : '',
      alt_override: typeof entry.alt_override === 'string' ? entry.alt_override : '',
    }
  })
}

/**
 * @param {{ seo: Record<string, unknown> }} form
 * @returns {Record<string, unknown>}
 */
export function formToSeoPayload(form) {
  return form.seo
}

/**
 * @param {Record<string, unknown>} service
 * @param {string} field
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function updateServiceField(service, field, value) {
  return { ...service, [field]: value }
}

/**
 * @param {Record<string, Record<string, unknown>>} media
 * @param {string} slot
 * @param {Partial<{ storage_path: string, alt_override: string, media_id: string }>} patch
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateMediaSlot(media, slot, patch) {
  return {
    ...media,
    [slot]: {
      ...media[slot],
      slot,
      ...patch,
    },
  }
}

/**
 * Update a single field on a config list item (items, steps, etc.) without
 * clobbering sibling config keys or other list entries.
 * @param {Record<string, Record<string, unknown>>} sections
 * @param {string} sectionKey
 * @param {string} listKey
 * @param {number} index
 * @param {string} field
 * @param {unknown} value
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateConfigListItemField(sections, sectionKey, listKey, index, field, value) {
  const section = sections[sectionKey]
  if (!section) return sections

  const config =
    section.config && typeof section.config === 'object'
      ? /** @type {Record<string, unknown>} */ (section.config)
      : {}
  const list = Array.isArray(config[listKey]) ? [.../** @type {unknown[]} */ (config[listKey])] : []
  const current = list[index]
  if (!current || typeof current !== 'object') return sections

  list[index] = {
    .../** @type {Record<string, unknown>} */ (current),
    [field]: value,
  }

  return {
    ...sections,
    [sectionKey]: {
      ...section,
      config: {
        ...config,
        [listKey]: list,
      },
    },
  }
}

/**
 * @param {Record<string, unknown>} seo
 * @param {string} field
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function updateSeoField(seo, field, value) {
  return { ...seo, [field]: value }
}

/**
 * @param {Record<string, Record<string, unknown>>} sections
 * @param {string} sectionKey
 * @param {boolean} isEnabled
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateSectionEnabled(sections, sectionKey, isEnabled) {
  return {
    ...sections,
    [sectionKey]: {
      ...sections[sectionKey],
      is_enabled: isEnabled,
    },
  }
}
