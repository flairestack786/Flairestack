import {
  Brain,
  Clock,
  Compass,
  Code2,
  Cpu,
  FlaskConical,
  Layers,
  Layout,
  Palette,
  Rocket,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react'
import { companyStats } from '../data/companyStats'
import { homeProcessSteps } from '../data/homeProcessSteps'
import { technologiesRowA, technologiesRowB } from '../data/technologies'
import { resolveLucideIcon } from './lucideIcons'
import { getPublicUrl } from './media'
import { supabase } from './supabase'

const HOME_SLUG = 'home'

const FALLBACK_PROCESS_ICONS = [Search, Compass, Palette, Code2, FlaskConical, Rocket]

const FALLBACK_WHY_CHOOSE_ITEMS = [
  {
    title: 'Scalable architecture',
    description:
      'We design cloud-native systems, APIs, and data layers that grow from MVP to millions of users — without costly rewrites or downtime.',
    iconName: 'Layers',
    Icon: Layers,
  },
  {
    title: 'Modern technologies',
    description:
      'React, Next.js, Node, Python, AWS, and proven AI stacks — chosen for performance, maintainability, and long-term team velocity.',
    iconName: 'Cpu',
    Icon: Cpu,
  },
  {
    title: 'Fast delivery',
    description:
      'Agile squads ship production-ready increments every sprint with clear milestones, demos, and transparent progress you can track.',
    iconName: 'Rocket',
    Icon: Rocket,
  },
  {
    title: 'Security-first systems',
    description:
      'Encryption, access control, compliance-aware workflows, and secure SDLC practices built into every phase of development.',
    iconName: 'Shield',
    Icon: Shield,
  },
  {
    title: 'Premium UI/UX',
    description:
      'Research-driven interfaces and design systems that improve adoption, reduce friction, and strengthen brand trust across every touchpoint.',
    iconName: 'Layout',
    Icon: Layout,
  },
  {
    title: 'AI automation expertise',
    description:
      'LLM integrations, intelligent workflows, and automation that save time — deployed responsibly with evaluation, monitoring, and governance.',
    iconName: 'Brain',
    Icon: Brain,
  },
]

const FALLBACK_CONTACT_TRUST = [
  { iconName: 'Clock', Icon: Clock, text: 'Response within 1 business day' },
  { iconName: 'Shield', Icon: Shield, text: 'NDA & enterprise security practices' },
  {
    iconName: 'Sparkles',
    Icon: Sparkles,
    text: 'Premium engineering execution powered by modern AI systems',
  },
]

/** @type {Map<string, import('react').ComponentType<{ size?: number, strokeWidth?: number, 'aria-hidden'?: boolean }>>} */
const technologyIconLookup = new Map(
  [...technologiesRowA, ...technologiesRowB].map(({ name, Icon }) => [name, Icon])
)

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
 * @param {unknown} value
 * @param {string[]} fallback
 * @returns {string[]}
 */
function stringArrayOrFallback(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback
  }

  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)

  return items.length > 0 ? items : fallback
}

/**
 * @param {string[]} names
 * @returns {Array<{ name: string, Icon: import('react').ComponentType }>}
 */
function mapTechnologyNames(names) {
  return names.map((name) => ({
    name,
    Icon: technologyIconLookup.get(name) ?? technologiesRowA[0].Icon,
  }))
}

/**
 * @param {unknown} items
 * @param {typeof FALLBACK_WHY_CHOOSE_ITEMS} fallback
 */
function normalizeWhyChooseItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ title?: string, description?: string, icon_name?: string }} */ (item)
      const fallbackItem = fallback[index] ?? fallback[0]
      const iconName = textOrFallback(source.icon_name, fallbackItem.iconName)
      return {
        title: textOrFallback(source.title, fallbackItem.title),
        description: textOrFallback(source.description, fallbackItem.description),
        iconName,
        Icon: resolveLucideIcon(iconName, fallbackItem.Icon),
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {unknown} steps
 */
function normalizeProcessSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return homeProcessSteps
  }

  const normalized = steps
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ step?: string, title?: string, text?: string }} */ (item)
      const fallback = homeProcessSteps[index] ?? homeProcessSteps[0]
      return {
        step: textOrFallback(source.step, fallback.step),
        title: textOrFallback(source.title, fallback.title),
        text: textOrFallback(source.text, fallback.text),
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : homeProcessSteps
}

/**
 * @param {unknown} icons
 */
function normalizeProcessIcons(icons) {
  if (!Array.isArray(icons) || icons.length === 0) {
    return FALLBACK_PROCESS_ICONS
  }

  const resolved = icons.map((name, index) =>
    resolveLucideIcon(
      typeof name === 'string' ? name : '',
      FALLBACK_PROCESS_ICONS[index] ?? FALLBACK_PROCESS_ICONS[0]
    )
  )

  return resolved.length > 0 ? resolved : FALLBACK_PROCESS_ICONS
}

/**
 * @param {unknown} stats
 */
function normalizeStats(stats) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return companyStats
  }

  const normalized = stats
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ value?: number, suffix?: string, label?: string }} */ (item)
      const label = String(source.label ?? '').trim()
      if (!label) return null
      return {
        value: Number(source.value) || 0,
        suffix: String(source.suffix ?? ''),
        label,
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : companyStats
}

/**
 * @param {unknown} items
 * @param {typeof FALLBACK_CONTACT_TRUST} fallback
 */
function normalizeTrustItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ icon_name?: string, text?: string }} */ (item)
      const fallbackItem = fallback[index] ?? fallback[0]
      const iconName = textOrFallback(source.icon_name, fallbackItem.iconName)
      return {
        iconName,
        Icon: resolveLucideIcon(iconName, fallbackItem.Icon),
        text: textOrFallback(source.text, fallbackItem.text),
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {Record<string, unknown> | undefined} section
 * @param {Record<string, unknown>} fallback
 */
function buildHeroSection(section, fallback) {
  const config =
    section?.config && typeof section.config === 'object'
      ? /** @type {Record<string, unknown>} */ (section.config)
      : {}
  const backgroundPath = String(config.background_image_path ?? '').trim()

  return {
    title: textOrFallback(section?.title, fallback.title),
    titleAccent: textOrFallback(section?.title_accent, fallback.titleAccent),
    intro: textOrFallback(section?.intro, fallback.intro),
    body: textOrFallback(section?.body, fallback.body),
    ctaLabel: textOrFallback(section?.cta_primary_label, fallback.ctaLabel),
    ctaUrl: textOrFallback(section?.cta_primary_url, fallback.ctaUrl),
    backgroundImageUrl: backgroundPath ? getPublicUrl(backgroundPath) : null,
    useBundledBackground: !backgroundPath,
  }
}

/**
 * @param {Record<string, unknown> | undefined} section
 * @param {Record<string, unknown>} fallback
 */
function buildServicesSection(section, fallback) {
  const config =
    section?.config && typeof section.config === 'object'
      ? /** @type {Record<string, unknown>} */ (section.config)
      : {}
  const imagePath = String(config.image_path ?? '').trim()

  return {
    eyebrow: textOrFallback(section?.eyebrow, fallback.eyebrow),
    title: textOrFallback(section?.title, fallback.title),
    titleAccent: textOrFallback(section?.title_accent, fallback.titleAccent),
    intro: textOrFallback(section?.intro, fallback.intro),
    body: textOrFallback(section?.body, fallback.body),
    ctaLabel: textOrFallback(section?.cta_primary_label, fallback.ctaLabel),
    ctaUrl: textOrFallback(section?.cta_primary_url, fallback.ctaUrl),
    panelLabel: textOrFallback(config.panel_label, fallback.panelLabel),
    visualAlt: textOrFallback(config.visual_alt, fallback.visualAlt),
    visualImageUrl: imagePath ? getPublicUrl(imagePath) : null,
    useBundledVisual: !imagePath,
    details: stringArrayOrFallback(config.details, fallback.details),
    points: stringArrayOrFallback(config.points, fallback.points),
  }
}

/** Default public Home page content used while loading or when CMS data is unavailable. */
export const FALLBACK_PUBLIC_HOME = {
  page: {
    slug: HOME_SLUG,
    title: 'Home',
    route_path: '/',
    status: 'published',
  },
  sections: {
    hero: {
      title: 'Building intelligent',
      titleAccent: 'digital experiences',
      intro: 'for the future.',
      body:
        'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.',
      ctaLabel: 'Book Consultation',
      ctaUrl: '#contact',
      backgroundImageUrl: null,
      useBundledBackground: true,
    },
    services: {
      eyebrow: 'Our services',
      title: 'Redefining',
      titleAccent: 'digital impact',
      intro: 'across the globe.',
      body:
        'From AI-native platforms to cloud infrastructure — we partner with ambitious teams to design, build, and scale products that feel cinematic, resilient, and ready for enterprise.',
      ctaLabel: 'Get in touch',
      ctaUrl: '#contact',
      panelLabel: 'Why FlaireStack',
      visualAlt:
        'FlaireStack service platform: code, AI, cloud, and analytics connected',
      visualImageUrl: null,
      useBundledVisual: true,
      details: [
        'We embed expert product engineers, cloud architects, and AI specialists into your roadmap to reduce delivery risk, accelerate release velocity, and improve platform reliability at scale.',
        'Whether you are launching a new product, modernizing legacy systems, or scaling AI across operations, we work as an extension of your team — with transparent sprints, senior ownership, and delivery tied to business outcomes.',
      ],
      points: [
        'Enterprise-grade architecture and governance',
        'Product-led UX with measurable conversion impact',
        'Continuous delivery with quality and security by design',
        'Cloud-native infrastructure, FinOps, and observability',
        'AI integration, automation, and intelligent workflows',
      ],
    },
    'why-choose': {
      eyebrow: 'The FlaireStack difference',
      title: 'Why choose',
      titleAccent: 'FlaireStack',
      intro:
        'Partner with a software development team that combines senior engineering, premium design, and AI-native thinking — so your product ships faster, scales reliably, and wins in the market.',
      items: FALLBACK_WHY_CHOOSE_ITEMS,
    },
    stats: {
      stats: companyStats,
    },
    process: {
      eyebrow: 'How we deliver',
      title: 'Our',
      titleAccent: 'Process',
      intro:
        'A proven six-step framework that keeps projects transparent, on schedule, and built for long-term success — from first workshop to production scale.',
      steps: homeProcessSteps,
      icons: FALLBACK_PROCESS_ICONS,
    },
    technologies: {
      eyebrow: 'Tech stack',
      title: 'Technologies we',
      titleAccent: 'work with',
      intro:
        'Modern frameworks, clouds, databases, and AI platforms — integrated with the tools your teams already use.',
      rowA: technologiesRowA,
      rowB: technologiesRowB,
    },
    contact: {
      eyebrow: 'Start a project',
      title: "Let's Build Something",
      titleAccent: 'Exceptional Together',
      body:
        'Partner with FlaireStack for cinematic digital products engineered with precision — from intelligent automation to mission-critical platforms that scale globally.',
      capabilities: [
        'AI solutions',
        'Enterprise software',
        'Scalable digital products',
        'Cloud systems',
        'Custom development services',
      ],
      trustItems: FALLBACK_CONTACT_TRUST,
    },
  },
}

/**
 * @param {Record<string, unknown> | null | undefined} page
 * @param {Record<string, unknown>[] | null | undefined} sectionRows
 * @returns {typeof FALLBACK_PUBLIC_HOME}
 */
export function buildPublicHomePage(page, sectionRows) {
  const fallback = FALLBACK_PUBLIC_HOME
  const sectionMap = Object.fromEntries(
    (sectionRows ?? []).map((row) => [String(row.section_key), row])
  )

  const heroSection = sectionMap.hero
  const servicesSection = sectionMap.services
  const whySection = sectionMap['why-choose']
  const statsSection = sectionMap.stats
  const processSection = sectionMap.process
  const technologiesSection = sectionMap.technologies
  const contactSection = sectionMap.contact

  const statsConfig =
    statsSection?.config && typeof statsSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (statsSection.config)
      : {}
  const processConfig =
    processSection?.config && typeof processSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (processSection.config)
      : {}
  const technologiesConfig =
    technologiesSection?.config && typeof technologiesSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (technologiesSection.config)
      : {}
  const contactConfig =
    contactSection?.config && typeof contactSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (contactSection.config)
      : {}
  const whyConfig =
    whySection?.config && typeof whySection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (whySection.config)
      : {}

  const fallbackTechNamesA = fallback.sections.technologies.rowA.map((item) => item.name)
  const fallbackTechNamesB = fallback.sections.technologies.rowB.map((item) => item.name)

  return {
    page: {
      slug: textOrFallback(page?.slug, fallback.page.slug),
      title: textOrFallback(page?.title, fallback.page.title),
      route_path: textOrFallback(page?.route_path, fallback.page.route_path),
      status: textOrFallback(page?.status, fallback.page.status),
    },
    sections: {
      hero: buildHeroSection(heroSection, fallback.sections.hero),
      services: buildServicesSection(servicesSection, fallback.sections.services),
      'why-choose': {
        eyebrow: textOrFallback(whySection?.eyebrow, fallback.sections['why-choose'].eyebrow),
        title: textOrFallback(whySection?.title, fallback.sections['why-choose'].title),
        titleAccent: textOrFallback(
          whySection?.title_accent,
          fallback.sections['why-choose'].titleAccent
        ),
        intro: textOrFallback(whySection?.intro, fallback.sections['why-choose'].intro),
        items: normalizeWhyChooseItems(whyConfig.items, fallback.sections['why-choose'].items),
      },
      stats: {
        stats: normalizeStats(statsConfig.stats),
      },
      process: {
        eyebrow: textOrFallback(processSection?.eyebrow, fallback.sections.process.eyebrow),
        title: textOrFallback(processSection?.title, fallback.sections.process.title),
        titleAccent: textOrFallback(
          processSection?.title_accent,
          fallback.sections.process.titleAccent
        ),
        intro: textOrFallback(processSection?.intro, fallback.sections.process.intro),
        steps: normalizeProcessSteps(processConfig.steps),
        icons: normalizeProcessIcons(processConfig.icons),
      },
      technologies: {
        eyebrow: textOrFallback(
          technologiesSection?.eyebrow,
          fallback.sections.technologies.eyebrow
        ),
        title: textOrFallback(technologiesSection?.title, fallback.sections.technologies.title),
        titleAccent: textOrFallback(
          technologiesSection?.title_accent,
          fallback.sections.technologies.titleAccent
        ),
        intro: textOrFallback(technologiesSection?.intro, fallback.sections.technologies.intro),
        rowA: mapTechnologyNames(
          stringArrayOrFallback(technologiesConfig.row_a, fallbackTechNamesA)
        ),
        rowB: mapTechnologyNames(
          stringArrayOrFallback(technologiesConfig.row_b, fallbackTechNamesB)
        ),
      },
      contact: {
        eyebrow: textOrFallback(contactSection?.eyebrow, fallback.sections.contact.eyebrow),
        title: textOrFallback(contactSection?.title, fallback.sections.contact.title),
        titleAccent: textOrFallback(
          contactSection?.title_accent,
          fallback.sections.contact.titleAccent
        ),
        body: textOrFallback(contactSection?.body, fallback.sections.contact.body),
        capabilities: stringArrayOrFallback(
          contactConfig.capabilities,
          fallback.sections.contact.capabilities
        ),
        trustItems: normalizeTrustItems(
          contactConfig.trust_items,
          fallback.sections.contact.trustItems
        ),
      },
    },
  }
}

/**
 * Load the published Home page and enabled sections for the public site.
 * @returns {Promise<{ page: Record<string, unknown>, sections: Record<string, unknown>[] } | null>}
 */
export async function fetchPublishedHomePage() {
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', HOME_SLUG)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!page) {
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    throw sectionsError
  }

  return { page, sections: sections ?? [] }
}
