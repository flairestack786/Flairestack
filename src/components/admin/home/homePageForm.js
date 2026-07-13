/** Section keys managed by the admin Home editor. */
export const HOME_EDITOR_SECTION_KEYS = [
  'hero',
  'services',
  'why-choose',
  'stats',
  'process',
  'technologies',
  'contact',
]

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
    title_accent: row.title_accent ?? '',
    intro: row.intro ?? '',
    body: row.body ?? '',
    cta_primary_label: row.cta_primary_label ?? '',
    cta_primary_url: row.cta_primary_url ?? '',
    cta_secondary_label: row.cta_secondary_label ?? '',
    cta_secondary_url: row.cta_secondary_url ?? '',
    icon_name: row.icon_name ?? '',
    config: structuredClone(row.config ?? {}),
    sort_order: row.sort_order ?? 0,
    is_enabled: row.is_enabled ?? true,
  }
}

/**
 * @param {Record<string, unknown>} page
 * @param {Record<string, unknown>[]} sections
 * @returns {{ pageId: string, sections: Record<string, Record<string, unknown>> }}
 */
export function homeDataToForm(page, sections) {
  const sectionMap = Object.fromEntries(
    sections
      .filter((row) => HOME_EDITOR_SECTION_KEYS.includes(row.section_key))
      .map((row) => [row.section_key, sectionToForm(row)])
  )

  for (const key of HOME_EDITOR_SECTION_KEYS) {
    if (!sectionMap[key]) {
      sectionMap[key] = sectionToForm({ section_key: key, config: {} })
    }
  }

  return {
    pageId: page.id,
    sections: sectionMap,
  }
}

/**
 * @param {{ pageId: string, sections: Record<string, Record<string, unknown>> }} form
 * @returns {Record<string, unknown>[]}
 */
export function formToSectionPayloads(form) {
  return HOME_EDITOR_SECTION_KEYS.map((key) => form.sections[key]).filter((section) => section?.id)
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function formsAreEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * @param {Record<string, Record<string, unknown>>} sections
 * @param {string} sectionKey
 * @param {string} field
 * @param {unknown} value
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateSectionField(sections, sectionKey, field, value) {
  return {
    ...sections,
    [sectionKey]: {
      ...sections[sectionKey],
      [field]: value,
    },
  }
}

/**
 * @param {Record<string, Record<string, unknown>>} sections
 * @param {string} sectionKey
 * @param {string} configKey
 * @param {unknown} value
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateSectionConfig(sections, sectionKey, configKey, value) {
  const section = sections[sectionKey]
  return {
    ...sections,
    [sectionKey]: {
      ...section,
      config: {
        ...section.config,
        [configKey]: value,
      },
    },
  }
}
