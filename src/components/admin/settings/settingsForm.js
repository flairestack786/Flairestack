/** Editable site_settings columns managed by the admin Settings page. */
export const SETTINGS_EDITABLE_FIELDS = [
  'company_name',
  'tagline',
  'logo_url',
  'favicon_url',
  'phone',
  'email',
  'address',
  'google_maps_url',
  'facebook_url',
  'instagram_url',
  'linkedin_url',
  'x_url',
  'youtube_url',
  'github_url',
  'business_hours',
  'timezone',
  'copyright_text',
  'default_meta_title',
  'default_meta_description',
  'default_keywords',
  'default_og_image',
  'google_analytics_id',
  'google_tag_manager_id',
  'meta_pixel_id',
  'microsoft_clarity_id',
]

/**
 * @param {Record<string, unknown> | null | undefined} settings
 * @returns {Record<string, string>}
 */
export function settingsToForm(settings) {
  return Object.fromEntries(
    SETTINGS_EDITABLE_FIELDS.map((key) => [key, settings?.[key] != null ? String(settings[key]) : ''])
  )
}

/**
 * @param {Record<string, string>} a
 * @param {Record<string, string>} b
 * @returns {boolean}
 */
export function formsAreEqual(a, b) {
  return SETTINGS_EDITABLE_FIELDS.every((key) => (a[key] ?? '') === (b[key] ?? ''))
}
