import { supabase } from './supabase'

const TABLE = 'site_settings'

const IMMUTABLE_FIELDS = new Set(['id', 'created_at', 'updated_at'])

/** Default values used when bootstrapping the singleton site_settings row. */
export const DEFAULT_SITE_SETTINGS = {
  company_name: 'FlaireStack LLC',
  tagline: 'AI, cloud, and software — built for scale',
  email: 'info@flairestack.com',
  phone: '+1 (234) 567-890',
  address: 'Chicago, IL — Serving clients worldwide',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  linkedin_url: 'https://linkedin.com',
  timezone: 'America/Chicago',
  copyright_text: '© FlaireStack LLC. All rights reserved.',
  default_meta_title: 'FlaireStack | AI-First Software Development Studio',
  default_meta_description:
    'FlaireStack is an AI-first software development studio delivering custom applications, cloud-native platforms, and intelligent automation with the latest technologies — from LLMs and modern frameworks to secure, scalable infrastructure.',
  default_keywords:
    'software development, AI, cloud, web development, mobile apps, enterprise software, Chicago',
  business_hours: 'Monday–Friday, 9:00 AM – 6:00 PM CT',
}

/**
 * Strip read-only columns from a write payload.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
function sanitizePayload(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !IMMUTABLE_FIELDS.has(key))
  )
}

/**
 * Fetch the singleton site_settings row (oldest row when multiple exist).
 * Bootstraps a default row when the table is empty.
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getSiteSettings() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  return createSiteSettings(DEFAULT_SITE_SETTINGS)
}

/**
 * Update the singleton site_settings row by id.
 * @param {Record<string, unknown>} data — fields to update (id/created_at/updated_at ignored)
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateSiteSettings(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('updateSiteSettings requires a data object.')
  }

  const current = await getSiteSettings()
  const payload = sanitizePayload(data)

  if (Object.keys(payload).length === 0) {
    throw new Error('updateSiteSettings requires at least one field to update.')
  }

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', current.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return updated
}

/**
 * Persist site settings (alias for updateSiteSettings).
 * @param {Record<string, unknown>} data
 * @returns {Promise<Record<string, unknown>>}
 */
export async function saveSiteSettings(data) {
  return updateSiteSettings(data)
}

/**
 * Insert the singleton site_settings row. Fails if a row already exists.
 * @param {Record<string, unknown>} data — required: company_name
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createSiteSettings(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('createSiteSettings requires a data object.')
  }

  const { data: existing, error: readError } = await supabase
    .from(TABLE)
    .select('id')
    .limit(1)
    .maybeSingle()

  if (readError) {
    throw readError
  }

  if (existing) {
    throw new Error('Site settings already exist. Use updateSiteSettings() instead.')
  }

  const payload = sanitizePayload(data)

  if (!payload.company_name) {
    throw new Error('createSiteSettings requires company_name.')
  }

  const { data: created, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return created
}
