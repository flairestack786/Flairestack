import {
  formsAreEqual,
  updateSectionConfig,
  updateSectionField,
} from '../home/homePageForm'

export { formsAreEqual, updateSectionConfig, updateSectionField }

/** Section keys managed by the admin About editor. */
export const ABOUT_EDITOR_SECTION_KEYS = [
  'hero',
  'company-story',
  'mission',
  'vision',
  'values',
  'team',
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
export function aboutDataToForm(page, sections) {
  const sectionMap = Object.fromEntries(
    sections
      .filter((row) => ABOUT_EDITOR_SECTION_KEYS.includes(row.section_key))
      .map((row) => [row.section_key, sectionToForm(row)])
  )

  for (const key of ABOUT_EDITOR_SECTION_KEYS) {
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
  return ABOUT_EDITOR_SECTION_KEYS.map((key) => form.sections[key]).filter((section) => section?.id)
}

/**
 * @param {Record<string, Record<string, unknown>>} sections
 * @param {number} memberIndex
 * @param {string} imagePath
 * @returns {Record<string, Record<string, unknown>>}
 */
export function updateTeamMemberImage(sections, memberIndex, imagePath) {
  const section = sections.team
  const config = section?.config ?? {}
  const members = Array.isArray(config.members) ? [...config.members] : []
  const current = members[memberIndex] ?? {}
  members[memberIndex] = { ...current, image_path: imagePath || null }
  return updateSectionConfig(sections, 'team', 'members', members)
}
