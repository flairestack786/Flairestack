import { getSiteSettings, saveSiteSettings } from './siteSettings'
import { getPublicUrl } from './media'
import { parseStructuredDataInput, stringifyStructuredData } from './seoAnalysis'

/** @type {readonly string[]} */
export const GLOBAL_SEO_FIELDS = Object.freeze([
  'website_name',
  'company_name',
  'default_meta_title',
  'default_meta_description',
  'default_og_image',
  'default_twitter_image',
  'logo_url',
  'canonical_base_url',
  'default_robots',
  'gsc_verification',
  'bing_verification',
  'google_analytics_id',
  'google_tag_manager_id',
  'microsoft_clarity_id',
  'meta_pixel_id',
  'facebook_url',
  'instagram_url',
  'linkedin_url',
  'x_url',
  'youtube_url',
  'github_url',
  'organization_jsonld_text',
  'website_jsonld_text',
  'template_meta_title',
  'template_meta_description',
  'template_og_title',
  'template_og_description',
  'template_twitter_title',
  'template_twitter_description',
])

export const DEFAULT_SEO_TEMPLATES = Object.freeze({
  meta_title: '{{Page Title}} | {{Website Name}}',
  meta_description: 'Learn more about {{Page Title}} from {{Company Name}}.',
  og_title: '{{Page Title}} | {{Website Name}}',
  og_description: 'Learn more about {{Page Title}} from {{Company Name}}.',
  twitter_title: '{{Page Title}} | {{Website Name}}',
  twitter_description: 'Learn more about {{Page Title}} from {{Company Name}}.',
})

/**
 * @param {unknown} value
 */
function asString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {Record<string, unknown> | null | undefined} settings
 */
export function globalSeoToForm(settings) {
  const templates =
    settings?.seo_templates && typeof settings.seo_templates === 'object'
      ? /** @type {Record<string, unknown>} */ (settings.seo_templates)
      : {}

  return {
    website_name: asString(settings?.website_name || settings?.company_name),
    company_name: asString(settings?.company_name),
    default_meta_title: asString(settings?.default_meta_title),
    default_meta_description: asString(settings?.default_meta_description),
    default_og_image: asString(settings?.default_og_image),
    default_twitter_image: asString(settings?.default_twitter_image),
    logo_url: asString(settings?.logo_url),
    canonical_base_url: asString(settings?.canonical_base_url),
    default_robots: asString(settings?.default_robots) || 'index,follow',
    gsc_verification: asString(settings?.gsc_verification),
    bing_verification: asString(settings?.bing_verification),
    google_analytics_id: asString(settings?.google_analytics_id),
    google_tag_manager_id: asString(settings?.google_tag_manager_id),
    microsoft_clarity_id: asString(settings?.microsoft_clarity_id),
    meta_pixel_id: asString(settings?.meta_pixel_id),
    facebook_url: asString(settings?.facebook_url),
    instagram_url: asString(settings?.instagram_url),
    linkedin_url: asString(settings?.linkedin_url),
    x_url: asString(settings?.x_url),
    youtube_url: asString(settings?.youtube_url),
    github_url: asString(settings?.github_url),
    organization_jsonld_text: stringifyStructuredData(settings?.organization_jsonld ?? {}),
    website_jsonld_text: stringifyStructuredData(settings?.website_jsonld ?? {}),
    template_meta_title: asString(templates.meta_title) || DEFAULT_SEO_TEMPLATES.meta_title,
    template_meta_description:
      asString(templates.meta_description) || DEFAULT_SEO_TEMPLATES.meta_description,
    template_og_title: asString(templates.og_title) || DEFAULT_SEO_TEMPLATES.og_title,
    template_og_description:
      asString(templates.og_description) || DEFAULT_SEO_TEMPLATES.og_description,
    template_twitter_title:
      asString(templates.twitter_title) || DEFAULT_SEO_TEMPLATES.twitter_title,
    template_twitter_description:
      asString(templates.twitter_description) || DEFAULT_SEO_TEMPLATES.twitter_description,
  }
}

/**
 * @param {Record<string, string>} form
 */
export function globalSeoFormToPayload(form) {
  const org = parseStructuredDataInput(form.organization_jsonld_text ?? '')
  const web = parseStructuredDataInput(form.website_jsonld_text ?? '')
  if (!org.ok) throw new Error(`Organization JSON-LD: ${org.error}`)
  if (!web.ok) throw new Error(`Website JSON-LD: ${web.error}`)

  return {
    website_name: asString(form.website_name) || null,
    company_name: asString(form.company_name) || undefined,
    default_meta_title: asString(form.default_meta_title) || null,
    default_meta_description: asString(form.default_meta_description) || null,
    default_og_image: asString(form.default_og_image) || null,
    default_twitter_image: asString(form.default_twitter_image) || null,
    logo_url: asString(form.logo_url) || null,
    canonical_base_url: asString(form.canonical_base_url) || null,
    default_robots: asString(form.default_robots) || 'index,follow',
    gsc_verification: asString(form.gsc_verification) || null,
    bing_verification: asString(form.bing_verification) || null,
    google_analytics_id: asString(form.google_analytics_id) || null,
    google_tag_manager_id: asString(form.google_tag_manager_id) || null,
    microsoft_clarity_id: asString(form.microsoft_clarity_id) || null,
    meta_pixel_id: asString(form.meta_pixel_id) || null,
    facebook_url: asString(form.facebook_url) || null,
    instagram_url: asString(form.instagram_url) || null,
    linkedin_url: asString(form.linkedin_url) || null,
    x_url: asString(form.x_url) || null,
    youtube_url: asString(form.youtube_url) || null,
    github_url: asString(form.github_url) || null,
    organization_jsonld: org.value ?? {},
    website_jsonld: web.value ?? {},
    seo_templates: {
      meta_title: asString(form.template_meta_title) || DEFAULT_SEO_TEMPLATES.meta_title,
      meta_description:
        asString(form.template_meta_description) || DEFAULT_SEO_TEMPLATES.meta_description,
      og_title: asString(form.template_og_title) || DEFAULT_SEO_TEMPLATES.og_title,
      og_description:
        asString(form.template_og_description) || DEFAULT_SEO_TEMPLATES.og_description,
      twitter_title:
        asString(form.template_twitter_title) || DEFAULT_SEO_TEMPLATES.twitter_title,
      twitter_description:
        asString(form.template_twitter_description) || DEFAULT_SEO_TEMPLATES.twitter_description,
    },
  }
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
 * @param {string} template
 * @param {Record<string, string>} vars
 */
export function applySeoTemplate(template, vars) {
  return String(template ?? '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key) => {
    const normalized = String(key).trim().toLowerCase()
    const map = {
      'page title': vars.pageTitle ?? '',
      'service name': vars.serviceName ?? vars.pageTitle ?? '',
      'company name': vars.companyName ?? '',
      'website name': vars.websiteName ?? '',
      'primary keyword': vars.primaryKeyword ?? '',
    }
    return map[normalized] ?? ''
  })
}

/**
 * Build default SEO field values from global templates.
 * @param {Record<string, unknown>} globals
 * @param {{ pageTitle: string, serviceName?: string, primaryKeyword?: string }} context
 */
export function buildTemplatedDefaults(globals, context) {
  const form = globalSeoToForm(globals)
  const vars = {
    pageTitle: context.pageTitle || '',
    serviceName: context.serviceName || context.pageTitle || '',
    companyName: form.company_name || 'FlaireStack',
    websiteName: form.website_name || form.company_name || 'FlaireStack',
    primaryKeyword: context.primaryKeyword || '',
  }

  return {
    meta_title: applySeoTemplate(form.template_meta_title, vars),
    meta_description: applySeoTemplate(form.template_meta_description, vars),
    og_title: applySeoTemplate(form.template_og_title, vars),
    og_description: applySeoTemplate(form.template_og_description, vars),
    twitter_title: applySeoTemplate(form.template_twitter_title, vars),
    twitter_description: applySeoTemplate(form.template_twitter_description, vars),
    robots: form.default_robots || 'index,follow',
    canonical_url: form.canonical_base_url
      ? `${form.canonical_base_url.replace(/\/$/, '')}/${String(context.pageTitle || '')
          .toLowerCase()
          .replace(/\s+/g, '-')}`
      : '',
    og_image_path: form.default_og_image,
    twitter_image_path: form.default_twitter_image || form.default_og_image,
  }
}

/**
 * Resolve page SEO with global inheritance.
 * Empty page fields inherit globals / templates.
 * @param {Record<string, unknown>} pageSeo
 * @param {Record<string, unknown>} globals
 * @param {{ pageTitle?: string, routePath?: string, entityType?: string }} [context]
 */
export function resolveInheritedSeo(pageSeo, globals, context = {}) {
  const g = globalSeoToForm(globals)
  const pageTitle = asString(context.pageTitle || pageSeo.label || '')
  const templated = buildTemplatedDefaults(globals, {
    pageTitle,
    serviceName: pageTitle,
    primaryKeyword: asString(pageSeo.focus_keyword),
  })

  const routePath = asString(context.routePath || pageSeo.route_path || '/')
  const base = asString(g.canonical_base_url).replace(/\/$/, '')
  const defaultCanonical = base
    ? `${base}${routePath.startsWith('/') ? routePath : `/${routePath}`}`
    : ''

  /** @type {Record<string, { value: string, inherited: boolean, source: string }>} */
  const fields = {}

  /**
   * @param {string} key
   * @param {string} local
   * @param {string} fallback
   * @param {string} source
   */
  const pick = (key, local, fallback, source) => {
    const localValue = asString(local)
    if (localValue) {
      fields[key] = { value: localValue, inherited: false, source: 'page' }
      return
    }
    fields[key] = { value: asString(fallback), inherited: Boolean(asString(fallback)), source }
  }

  pick('meta_title', pageSeo.meta_title, g.default_meta_title || templated.meta_title, 'global')
  pick(
    'meta_description',
    pageSeo.meta_description,
    asString(pageSeo.page_description) ||
      g.default_meta_description ||
      templated.meta_description,
    asString(pageSeo.page_description) ? 'page_description' : 'global'
  )
  pick('canonical_url', pageSeo.canonical_url, defaultCanonical, 'global')
  pick('robots', pageSeo.robots, g.default_robots || 'index,follow', 'global')
  pick('og_title', pageSeo.og_title, fields.meta_title.value || templated.og_title, 'inherited')
  pick(
    'og_description',
    pageSeo.og_description,
    fields.meta_description.value || templated.og_description,
    'inherited'
  )
  pick(
    'og_image_path',
    pageSeo.og_image_path,
    g.default_og_image,
    'global'
  )
  pick(
    'twitter_title',
    pageSeo.twitter_title,
    fields.og_title.value || templated.twitter_title,
    'inherited'
  )
  pick(
    'twitter_description',
    pageSeo.twitter_description,
    fields.og_description.value || templated.twitter_description,
    'inherited'
  )
  pick(
    'twitter_image_path',
    pageSeo.twitter_image_path,
    g.default_twitter_image || g.default_og_image || fields.og_image_path.value,
    'global'
  )

  /** @type {Record<string, string>} */
  const resolved = {}
  /** @type {Record<string, boolean>} */
  const inherited = {}
  for (const [key, info] of Object.entries(fields)) {
    resolved[key] = info.value
    inherited[key] = info.inherited
  }

  return {
    resolved: {
      ...pageSeo,
      ...resolved,
      focus_keyword: asString(pageSeo.focus_keyword),
      page_description: asString(pageSeo.page_description),
      related_keywords: Array.isArray(pageSeo.related_keywords)
        ? pageSeo.related_keywords
        : [],
      website_name: g.website_name,
      company_name: g.company_name,
    },
    inherited,
    globals: g,
  }
}

/**
 * @param {string | null | undefined} path
 */
export function mediaPathToUrl(path) {
  const value = asString(path)
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  try {
    return getPublicUrl(value)
  } catch {
    return ''
  }
}
