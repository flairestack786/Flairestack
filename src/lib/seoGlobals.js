import { getSiteSettings, saveSiteSettings } from './siteSettings'
import { getPublicUrl } from './media'
import {
  globalSeoToForm,
  globalSeoFormToPayload,
} from './seoInheritance'

export * from './seoInheritance'

/**
 * @param {unknown} value
 */
function asString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

export async function fetchGlobalSeoSettings() {
  const settings = await getSiteSettings()
  return { settings, form: globalSeoToForm(settings) }
}

/**
 * @param {Record<string, string>} form
 */
export async function saveGlobalSeoSettings(form) {
  const payload = globalSeoFormToPayload(form)
  const updated = await saveSiteSettings(payload)
  return { settings: updated, form: globalSeoToForm(updated) }
}

/**
 * @param {string | null | undefined} path
 * @param {(path: string) => string} [resolvePublicUrl]
 */
export function mediaPathToUrl(path, resolvePublicUrl) {
  const value = asString(path)
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  try {
    const resolve = resolvePublicUrl || getPublicUrl
    return resolve(value)
  } catch {
    return ''
  }
}
