import { getServiceBySlug } from '../data/services'
import { FALLBACK_SERVICE_TESTIMONIALS } from './publicTestimonials'
import { SERVICE_SECTION_KEYS } from './serviceDefaults'
import { getPublicUrl } from './media'
import { supabase } from './supabase'
import { PUBLIC_SEO_SELECT } from './publicSeo'

const DEFAULT_ANCHOR_NAV = [
  { id: 'challenges', label: 'Challenges', sectionKey: 'challenges' },
  { id: 'framework', label: 'Services', sectionKey: 'framework' },
  { id: 'features', label: 'Capabilities', sectionKey: 'features' },
  { id: 'growth', label: 'Benefits', sectionKey: 'growth' },
  { id: 'process', label: 'Process', sectionKey: 'process' },
  { id: 'tech', label: 'Tech Stack', sectionKey: 'tech' },
  { id: 'faq', label: 'FAQ', sectionKey: 'faq' },
]

/** @type {Record<string, boolean>} */
const ALL_SECTIONS_ENABLED = Object.fromEntries(
  SERVICE_SECTION_KEYS.map((key) => [key, true])
)

/** Safe empty page shape for CMS-only services with no static fallback. */
const EMPTY_PAGE = {
  heroHeadline: '',
  heroSubheadline: '',
  heroCta: 'Start Your Project',
  heroSecondaryCta: 'View Our Process',
  heroImage: null,
  heroImages: [],
  sectionEnabled: { ...ALL_SECTIONS_ENABLED },
  anchorNav: DEFAULT_ANCHOR_NAV,
  challenges: { is_enabled: true, title: '', intro: '', items: [] },
  framework: { is_enabled: true, title: '', intro: '', items: [] },
  features: { is_enabled: true, title: '', intro: '', items: [] },
  growth: { is_enabled: true, title: '', intro: '', items: [] },
  testimonials: {
    is_enabled: true,
    items: FALLBACK_SERVICE_TESTIMONIALS,
    background: null,
  },
  testimonialsBackground: null,
  process: { is_enabled: true, title: '', intro: '', steps: [], image: null },
  industries: { is_enabled: true, title: '', intro: '', items: [] },
  tech: { is_enabled: true, title: '', intro: '', items: [] },
  postLaunch: { is_enabled: true, title: '', intro: '', items: [] },
  faqs: [],
  faq: { is_enabled: true },
  finalCta: {
    is_enabled: true,
    title: '',
    subtitle: '',
    button: 'Send Message',
    background: null,
  },
}

/**
 * @param {string} value
 * @param {string} fallback
 * @returns {string}
 */
function textOrFallback(value, fallback) {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

/**
 * CMS-driven services honor service_sections.is_enabled.
 * Static-only fallbacks keep every section visible.
 * @param {Record<string, unknown> | undefined} row
 * @param {boolean} hasCmsService
 * @returns {boolean}
 */
function resolveSectionEnabled(row, hasCmsService) {
  if (!hasCmsService) return true
  if (!row) return true
  return row.is_enabled !== false
}

/**
 * @param {Record<string, Record<string, unknown>>} sectionMap
 * @param {boolean} hasCmsService
 * @returns {Record<string, boolean>}
 */
function buildSectionEnabledMap(sectionMap, hasCmsService) {
  return Object.fromEntries(
    SERVICE_SECTION_KEYS.map((key) => [
      key,
      resolveSectionEnabled(sectionMap[key], hasCmsService),
    ])
  )
}

/**
 * Prefer a config storage path, then an optional media-slot/static fallback.
 * @param {unknown} path
 * @param {{ src: string, alt: string } | null | undefined} fallback
 * @param {string} [alt]
 * @returns {{ src: string, alt: string } | null}
 */
function resolveConfigImage(path, fallback, alt = '') {
  const trimmed = String(path ?? '').trim()
  if (trimmed) {
    return {
      src: getPublicUrl(trimmed),
      alt: alt || fallback?.alt || '',
    }
  }
  return fallback?.src ? fallback : null
}

/**
 * @param {unknown} items
 * @param {{ title: string, description: string, image?: { src: string, alt: string } }[]} fallback
 */
function normalizeItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  return items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return fallback[index] ?? fallback[0]
      }

      const source =
        /** @type {{ title?: string, description?: string, image_path?: string | null, image?: { src: string, alt: string } }} */ (
          item
        )
      const fb = fallback[index] ?? fallback[0] ?? { title: '', description: '' }
      const title = textOrFallback(source.title, fb.title)

      return {
        title,
        description: textOrFallback(source.description, fb.description),
        // Only CMS config paths here — callers layer media slots / static fallbacks.
        image: resolveConfigImage(source.image_path, null, title),
      }
    })
    .filter((item) => item?.title)
}

/**
 * @param {unknown} items
 * @param {{ q: string, a: string }[]} fallback
 */
function normalizeFaqs(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ question?: string, answer?: string, q?: string, a?: string }} */ (item)
      const fb = fallback[index] ?? fallback[0] ?? { q: '', a: '' }
      const q = textOrFallback(source.question ?? source.q, fb.q)
      const a = textOrFallback(source.answer ?? source.a, fb.a)
      if (!q) return null
      return { q, a }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {unknown} items
 * @param {string[]} fallback
 */
function normalizeTechItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }
      if (!item || typeof item !== 'object') return ''
      const source = /** @type {{ name?: string }} */ (item)
      return String(source.name ?? '').trim()
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {unknown} items
 * @param {{ step: string, title: string, text: string, image?: { src: string, alt: string } | null }[]} fallback
 */
function normalizeProcessSteps(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source =
        /** @type {{ step?: string, title?: string, text?: string, image_path?: string | null }} */ (
          item
        )
      const fb = fallback[index] ?? fallback[0] ?? { step: '', title: '', text: '' }
      const title = textOrFallback(source.title, fb.title)
      return {
        step: textOrFallback(source.step, fb.step),
        title,
        text: textOrFallback(source.text, fb.text),
        image: resolveConfigImage(source.image_path, fb.image ?? null, title),
      }
    })
    .filter((item) => item?.title)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {Record<string, unknown>[]} mediaRows
 * @returns {Map<string, { src: string, alt: string }>}
 */
function buildMediaMap(mediaRows) {
  const map = new Map()

  for (const row of mediaRows ?? []) {
    const slot = String(row.slot ?? '').trim()
    if (!slot) continue

    const asset =
      row.media_assets && typeof row.media_assets === 'object'
        ? /** @type {{ storage_path?: string, alt_text?: string }} */ (row.media_assets)
        : null
    const path = String(asset?.storage_path ?? '').trim()
    if (!path) continue

    map.set(slot, {
      src: getPublicUrl(path),
      alt: textOrFallback(row.alt_override, asset?.alt_text ?? ''),
    })
  }

  return map
}

/**
 * @param {Map<string, { src: string, alt: string }>} mediaMap
 * @param {string} slot
 * @param {{ src: string, alt: string } | null | undefined} fallback
 * @returns {{ src: string, alt: string } | null}
 */
function resolveMediaImage(mediaMap, slot, fallback) {
  const cmsImage = mediaMap.get(slot)
  if (cmsImage?.src) {
    return {
      src: cmsImage.src,
      alt: cmsImage.alt || fallback?.alt || '',
    }
  }
  return fallback?.src ? fallback : null
}

/**
 * @param {Record<string, unknown> | undefined} section
 * @param {{ title: string, intro: string, items: unknown[] }} fallback
 * @param {boolean} isEnabled
 */
function mergeItemsSection(section, fallback, isEnabled = true) {
  if (!section) {
    return { ...fallback, is_enabled: isEnabled }
  }

  const config =
    section.config && typeof section.config === 'object'
      ? /** @type {Record<string, unknown>} */ (section.config)
      : {}

  return {
    is_enabled: isEnabled,
    title: textOrFallback(section.title, fallback.title),
    intro: textOrFallback(section.intro, fallback.intro),
    items: normalizeItems(config.items, fallback.items),
  }
}

/**
 * @param {string} slug
 * @returns {ReturnType<typeof buildPublicServicePage> | null}
 */
export function buildFallbackPublicService(slug) {
  const fallbackService = getServiceBySlug(slug)
  if (!fallbackService) {
    return null
  }

  return buildPublicServicePage(null, [], [], null, fallbackService)
}

/**
 * @param {Record<string, unknown> | null} serviceRow
 * @param {Record<string, unknown>[]} sectionRows
 * @param {Record<string, unknown>[]} mediaRows
 * @param {Record<string, unknown> | null} seoRow
 * @param {ReturnType<typeof getServiceBySlug>} fallbackService
 * @returns {{ service: Record<string, unknown>, page: Record<string, unknown>, seo: { metaTitle: string, metaDescription: string } } | null}
 */
export function buildPublicServicePage(serviceRow, sectionRows, mediaRows, seoRow, fallbackService) {
  const fallback = fallbackService ?? null

  // CMS-published rows render without a static services.js entry.
  // Static data is only a fallback when no CMS row exists.
  if (!serviceRow && !fallback) {
    return null
  }

  const sectionMap = Object.fromEntries(
    (sectionRows ?? []).map((row) => [String(row.section_key), row])
  )
  const mediaMap = buildMediaMap(mediaRows)
  const fallbackPage = fallback?.page ?? EMPTY_PAGE
  const title = textOrFallback(serviceRow?.title, fallback?.title ?? 'Service')
  const slug = textOrFallback(serviceRow?.slug, fallback?.slug ?? '')
  const hasCmsService = Boolean(serviceRow)
  const sectionEnabled = buildSectionEnabledMap(sectionMap, hasCmsService)

  const heroSection = sectionMap.hero
  const heroConfig =
    heroSection?.config && typeof heroSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (heroSection.config)
      : {}
  const backgroundPath = String(heroConfig.background_image_path ?? '').trim()

  const mediaHeroImages = [
    resolveMediaImage(mediaMap, 'hero', fallbackPage.heroImage ?? fallbackPage.heroImages?.[0]),
    resolveMediaImage(mediaMap, 'overview', fallbackPage.heroImages?.[1]),
    resolveMediaImage(mediaMap, 'banner', fallbackPage.heroImages?.[2]),
  ].filter((image) => image?.src)

  // CMS hero background_image_path overrides media/static carousel (same key as Home Hero).
  const heroImages = backgroundPath
    ? [{ src: getPublicUrl(backgroundPath), alt: title }]
    : mediaHeroImages.length > 0
      ? mediaHeroImages
      : (fallbackPage.heroImages ?? []).filter((image) => image?.src)

  const fallbackFramework = fallbackPage.framework ?? { title: '', intro: '', items: [] }
  const frameworkSection = sectionMap.framework
  const frameworkConfig =
    frameworkSection?.config && typeof frameworkSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (frameworkSection.config)
      : {}
  const frameworkItems = normalizeItems(frameworkConfig.items, fallbackFramework.items ?? []).map(
    (item, index) => {
      // Config image_path already resolved in normalizeItems; otherwise media slot → static.
      if (item.image?.src) {
        return item
      }
      return {
        ...item,
        image: resolveMediaImage(
          mediaMap,
          `framework${index + 1}`,
          fallbackFramework.items?.[index]?.image
        ),
      }
    }
  )

  const fallbackProcess = fallbackPage.process ?? { title: '', intro: '', steps: [], image: null }
  const processSection = sectionMap.process
  const processConfig =
    processSection?.config && typeof processSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (processSection.config)
      : {}

  const page = {
    sectionEnabled,
    heroHeadline: heroSection
      ? textOrFallback(heroSection.title, fallbackPage.heroHeadline ?? title)
      : fallbackPage.heroHeadline ?? `Custom ${title} Company`,
    heroSubheadline: heroSection
      ? textOrFallback(heroSection.intro, fallbackPage.heroSubheadline ?? fallback?.description ?? '')
      : fallbackPage.heroSubheadline ?? fallback?.description ?? '',
    heroCta: heroSection
      ? textOrFallback(heroSection.cta_label, fallbackPage.heroCta ?? 'Start Your Project')
      : fallbackPage.heroCta ?? 'Start Your Project',
    heroSecondaryCta: heroSection
      ? textOrFallback(
          heroSection.secondary_cta_label,
          fallbackPage.heroSecondaryCta ?? 'View Our Process'
        )
      : fallbackPage.heroSecondaryCta ?? 'View Our Process',
    heroImage: heroImages[0] ?? fallbackPage.heroImage ?? null,
    heroImages:
      heroImages.length > 0
        ? heroImages
        : (fallbackPage.heroImages ?? []).filter((image) => image?.src),
    anchorNav: (fallbackPage.anchorNav?.length > 0 ? fallbackPage.anchorNav : DEFAULT_ANCHOR_NAV).filter(
      (item) => {
        const key = item.sectionKey ?? item.id
        return sectionEnabled[key] !== false
      }
    ),
    challenges: mergeItemsSection(
      sectionMap.challenges,
      fallbackPage.challenges ?? { title: '', intro: '', items: [] },
      sectionEnabled.challenges
    ),
    framework: {
      is_enabled: sectionEnabled.framework,
      ...(frameworkSection
        ? {
            title: textOrFallback(frameworkSection.title, fallbackFramework.title),
            intro: textOrFallback(frameworkSection.intro, fallbackFramework.intro),
            items: frameworkItems,
          }
        : fallbackFramework),
    },
    features: mergeItemsSection(
      sectionMap.features,
      fallbackPage.features ?? { title: '', intro: '', items: [] },
      sectionEnabled.features
    ),
    growth: mergeItemsSection(
      sectionMap.growth,
      fallbackPage.growth ?? { title: '', intro: '', items: [] },
      sectionEnabled.growth
    ),
    testimonials: {
      is_enabled: sectionEnabled.testimonials,
      items: FALLBACK_SERVICE_TESTIMONIALS,
      background: (() => {
        const testimonialsSection = sectionMap.testimonials
        const testimonialsConfig =
          testimonialsSection?.config && typeof testimonialsSection.config === 'object'
            ? /** @type {Record<string, unknown>} */ (testimonialsSection.config)
            : {}
        return resolveConfigImage(
          testimonialsConfig.background_image_path,
          resolveMediaImage(mediaMap, 'client_benefits', fallbackPage.testimonialsBackground)
        )
      })(),
    },
    // Keep flat alias for any older readers.
    testimonialsBackground: null,
    process: (() => {
      const mediaProcessImage = resolveMediaImage(mediaMap, 'process', fallbackProcess.image)
      if (!processSection) {
        return {
          is_enabled: sectionEnabled.process,
          ...fallbackProcess,
          image: mediaProcessImage,
          steps: fallbackProcess.steps ?? [],
        }
      }
      return {
        is_enabled: sectionEnabled.process,
        title: textOrFallback(processSection.title, fallbackProcess.title),
        intro: textOrFallback(processSection.intro, fallbackProcess.intro),
        steps: normalizeProcessSteps(processConfig.steps, fallbackProcess.steps ?? []),
        image: resolveConfigImage(processConfig.image_path, mediaProcessImage),
      }
    })(),
    industries: mergeItemsSection(
      sectionMap.industries,
      fallbackPage.industries ?? { title: '', intro: '', items: [] },
      sectionEnabled.industries
    ),
    tech: (() => {
      const techSection = sectionMap.tech
      const fallbackTech = fallbackPage.tech ?? { title: '', intro: '', items: [] }
      if (!techSection) {
        return { ...fallbackTech, is_enabled: sectionEnabled.tech }
      }
      const techConfig =
        techSection.config && typeof techSection.config === 'object'
          ? /** @type {Record<string, unknown>} */ (techSection.config)
          : {}
      return {
        is_enabled: sectionEnabled.tech,
        title: textOrFallback(techSection.title, fallbackTech.title),
        intro: textOrFallback(techSection.intro, fallbackTech.intro),
        items: normalizeTechItems(techConfig.items, fallbackTech.items ?? []),
      }
    })(),
    postLaunch: mergeItemsSection(
      sectionMap.post_launch,
      fallbackPage.postLaunch ?? { title: '', intro: '', items: [] },
      sectionEnabled.post_launch
    ),
    faqs: (() => {
      const faqSection = sectionMap.faq
      const fallbackFaqs = fallbackPage.faqs ?? fallback?.faqs ?? []
      if (!faqSection) return fallbackFaqs
      const faqConfig =
        faqSection.config && typeof faqSection.config === 'object'
          ? /** @type {Record<string, unknown>} */ (faqSection.config)
          : {}
      return normalizeFaqs(faqConfig.items, fallbackFaqs)
    })(),
    faq: {
      is_enabled: sectionEnabled.faq,
    },
    finalCta: (() => {
      const ctaSection = sectionMap.final_cta
      const fallbackCta = fallbackPage.finalCta ?? {
        title: '',
        subtitle: '',
        button: 'Send Message',
        background: null,
      }
      const mediaCtaBackground = resolveMediaImage(
        mediaMap,
        'business_outcomes',
        fallbackCta.background
      )
      if (!ctaSection) {
        return {
          is_enabled: sectionEnabled.final_cta,
          ...fallbackCta,
          background: mediaCtaBackground,
        }
      }
      const ctaConfig =
        ctaSection.config && typeof ctaSection.config === 'object'
          ? /** @type {Record<string, unknown>} */ (ctaSection.config)
          : {}
      return {
        is_enabled: sectionEnabled.final_cta,
        title: textOrFallback(ctaSection.title, fallbackCta.title),
        subtitle: textOrFallback(ctaSection.intro, fallbackCta.subtitle),
        button: textOrFallback(ctaSection.cta_label, fallbackCta.button),
        background: resolveConfigImage(ctaConfig.background_image_path, mediaCtaBackground),
      }
    })(),
  }

  // Preserve previous flat testimonialsBackground for layout compatibility.
  page.testimonialsBackground = page.testimonials.background

  const service = {
    slug,
    title,
    shortDescription: textOrFallback(serviceRow?.short_description, fallback?.shortDescription ?? ''),
    description: textOrFallback(serviceRow?.description, fallback?.description ?? ''),
    icon: textOrFallback(serviceRow?.icon_name, fallback?.icon ?? 'Layers'),
    image: page.heroImage?.src ?? fallback?.image ?? '',
    features: fallback?.features ?? [],
    technologies: fallback?.technologies ?? [],
    faqs: page.faqs,
    seoTitle: textOrFallback(seoRow?.meta_title, fallback?.seoTitle ?? `${title} | FlaireStack`),
    seoDescription: textOrFallback(
      seoRow?.meta_description,
      fallback?.seoDescription ?? ''
    ),
    page,
  }

  const seo = {
    metaTitle: service.seoTitle,
    metaDescription: service.seoDescription,
    pageDescription: textOrFallback(seoRow?.page_description, ''),
    row: seoRow ?? null,
  }

  return { service, page, seo }
}

/**
 * @param {string} slug
 * @returns {Promise<{ service: Record<string, unknown>, sections: Record<string, unknown>[], media: Record<string, unknown>[], seo: Record<string, unknown> | null } | null>}
 */
export async function fetchPublishedService(slug) {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()
  if (!normalizedSlug) {
    return null
  }

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', normalizedSlug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!service) {
    return null
  }

  const [sectionsResult, mediaResult, seoResult] = await Promise.all([
    supabase
      .from('service_sections')
      .select('*')
      .eq('service_id', service.id),
    supabase
      .from('service_media')
      .select('slot, alt_override, media_assets(storage_path, public_url, alt_text)')
      .eq('service_id', service.id),
    supabase
      .from('seo_metadata')
      .select(PUBLIC_SEO_SELECT)
      .eq('entity_type', 'service')
      .eq('service_id', service.id)
      .maybeSingle(),
  ])

  if (sectionsResult.error) {
    throw sectionsResult.error
  }
  if (mediaResult.error) {
    throw mediaResult.error
  }
  if (seoResult.error) {
    throw seoResult.error
  }

  return {
    service,
    sections: sectionsResult.data ?? [],
    media: mediaResult.data ?? [],
    seo: seoResult.data ?? null,
  }
}
