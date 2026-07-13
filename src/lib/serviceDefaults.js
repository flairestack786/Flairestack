import { getServiceBySlug } from '../data/services'

/** Section keys aligned with the public service page layout. */
export const SERVICE_SECTION_KEYS = [
  'hero',
  'challenges',
  'framework',
  'features',
  'growth',
  'testimonials',
  'process',
  'industries',
  'tech',
  'post_launch',
  'faq',
  'final_cta',
]

/**
 * @param {string} sectionKey
 * @returns {Record<string, unknown>}
 */
function emptySection(sectionKey) {
  return {
    section_key: sectionKey,
    eyebrow: '',
    title: '',
    intro: '',
    body: '',
    cta_label: '',
    cta_url: '',
    secondary_cta_label: '',
    secondary_cta_url: '',
    use_global_template: false,
    global_template_key: '',
    config: {},
    is_enabled: true,
  }
}

/**
 * @param {Record<string, unknown>} section
 * @param {string} title
 * @param {string} [intro]
 * @param {unknown[]} [items]
 * @returns {Record<string, unknown>}
 */
function withHeader(section, title, intro = '', items = undefined) {
  const next = { ...section, title, intro }
  if (items !== undefined) {
    next.config = { ...(section.config ?? {}), items }
  }
  return next
}

/**
 * Build default section rows from static site data when a slug matches.
 * @param {string} slug
 * @returns {Record<string, Record<string, unknown>>}
 */
export function buildDefaultSectionsForSlug(slug) {
  const service = getServiceBySlug(slug)
  const sections = Object.fromEntries(
    SERVICE_SECTION_KEYS.map((key) => [key, emptySection(key)])
  )

  if (!service?.page) {
    return sections
  }

  const page = service.page

  sections.hero = {
    ...sections.hero,
    title: page.heroHeadline ?? service.title,
    intro: page.heroSubheadline ?? service.description,
    cta_label: page.heroCta ?? 'Start Your Project',
    cta_url: '#contact',
    secondary_cta_label: page.heroSecondaryCta ?? 'View Our Process',
    secondary_cta_url: '#process',
  }

  if (page.challenges) {
    sections.challenges = withHeader(
      sections.challenges,
      page.challenges.title,
      page.challenges.intro,
      page.challenges.items ?? []
    )
  }

  if (page.framework) {
    sections.framework = withHeader(
      sections.framework,
      page.framework.title,
      page.framework.intro,
      (page.framework.items ?? []).map(({ title, description }) => ({ title, description }))
    )
  }

  if (page.features) {
    sections.features = withHeader(
      sections.features,
      page.features.title,
      page.features.intro,
      (page.features.items ?? []).map(({ title, description }) => ({ title, description }))
    )
  }

  if (page.growth) {
    sections.growth = withHeader(
      sections.growth,
      page.growth.title,
      page.growth.intro,
      (page.growth.items ?? []).map(({ title, description }) => ({ title, description }))
    )
  }

  sections.testimonials = withHeader(
    sections.testimonials,
    'Client Testimonials',
    'What our partners say about working with FlaireStack.'
  )

  if (page.process) {
    sections.process = withHeader(
      sections.process,
      page.process.title,
      page.process.intro,
      undefined
    )
    sections.process.config = {
      steps: page.process.steps ?? [],
    }
  }

  if (page.industries) {
    sections.industries = withHeader(
      sections.industries,
      page.industries.title,
      page.industries.intro,
      page.industries.items ?? []
    )
  }

  if (page.tech) {
    sections.tech = withHeader(sections.tech, page.tech.title, page.tech.intro, undefined)
    sections.tech.config = {
      items: (page.tech.items ?? []).map((name) =>
        typeof name === 'string' ? { name } : { name: name.name ?? name.title ?? '' }
      ),
    }
  }

  if (page.postLaunch) {
    sections.post_launch = withHeader(
      sections.post_launch,
      page.postLaunch.title,
      page.postLaunch.intro,
      page.postLaunch.items ?? []
    )
  }

  if (page.faqs) {
    sections.faq = {
      ...sections.faq,
      title: `Frequently Asked Questions`,
      intro: `Common questions about our ${service.title.toLowerCase()} services.`,
      config: {
        items: (page.faqs ?? []).map(({ q, a }) => ({ question: q, answer: a })),
      },
    }
  }

  if (page.finalCta) {
    sections.final_cta = {
      ...sections.final_cta,
      title: page.finalCta.title,
      intro: page.finalCta.subtitle,
      cta_label: page.finalCta.button ?? 'Send Message',
      cta_url: '#contact',
    }
  }

  return sections
}

/**
 * @param {string} slug
 * @param {string} title
 * @returns {{ meta_title: string, meta_description: string }}
 */
export function buildDefaultSeoForSlug(slug, title) {
  const service = getServiceBySlug(slug)
  return {
    meta_title: service?.seoTitle ?? `${title} | FlaireStack`,
    meta_description:
      service?.seoDescription ??
      `Professional ${title.toLowerCase()} services from FlaireStack — senior engineers, transparent delivery, and production-grade results.`,
  }
}

/**
 * @param {string} title
 * @param {string} [slug]
 * @returns {{ slug: string, title: string, short_description: string, description: string, icon_name: string, sort_order: number, status: string }}
 */
export function buildDefaultServiceFields(title, slug = '') {
  const normalizedSlug = slug.trim().toLowerCase()
  const service = normalizedSlug ? getServiceBySlug(normalizedSlug) : null

  return {
    slug: normalizedSlug,
    title: title.trim(),
    short_description: service?.shortDescription ?? `Professional ${title} for enterprise teams.`,
    description:
      service?.description ??
      `FlaireStack delivers ${title.toLowerCase()} with senior engineering talent, transparent delivery, and production-grade quality.`,
    icon_name: service?.icon ?? 'Layers',
    sort_order: 0,
    status: 'draft',
  }
}
