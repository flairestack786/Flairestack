import {
  companyStats,
} from '@/data/companyStats'
import { homeProcessSteps } from '@/data/homeProcessSteps'
import { technologiesRowA, technologiesRowB } from '@/data/technologies'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'

export type SerializableHomePage = {
  page: {
    slug: string
    title: string
    route_path: string
    status: string
    excerpt?: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    pageDescription: string
    row: Record<string, unknown> | null
  }
  sections: {
    hero: Record<string, unknown>
    services: Record<string, unknown>
    'why-choose': {
      eyebrow: string
      title: string
      titleAccent: string
      intro: string
      items: Array<{ title: string; description: string; iconName: string }>
    }
    stats: { stats: Array<{ value: number; suffix: string; label: string }> }
    process: {
      eyebrow: string
      title: string
      titleAccent: string
      intro: string
      steps: Array<{ step: string; title: string; text: string }>
      iconNames: string[]
    }
    technologies: {
      eyebrow: string
      title: string
      titleAccent: string
      intro: string
      rowA: Array<{ name: string; color?: string }>
      rowB: Array<{ name: string; color?: string }>
    }
    contact: {
      eyebrow: string
      title: string
      titleAccent: string
      body: string
      capabilities: string[]
      trustItems: Array<{ iconName: string; text: string }>
    }
  }
}

const FALLBACK_WHY_ITEMS = [
  {
    title: 'Scalable architecture',
    description:
      'We design cloud-native systems, APIs, and data layers that grow from MVP to millions of users — without costly rewrites or downtime.',
    iconName: 'Layers',
  },
  {
    title: 'Modern technologies',
    description:
      'React, Next.js, Node, Python, AWS, and proven AI stacks — chosen for performance, maintainability, and long-term team velocity.',
    iconName: 'Cpu',
  },
  {
    title: 'Fast delivery',
    description:
      'Agile squads ship production-ready increments every sprint with clear milestones, demos, and transparent progress you can track.',
    iconName: 'Rocket',
  },
  {
    title: 'Security-first systems',
    description:
      'Encryption, access control, compliance-aware workflows, and secure SDLC practices built into every phase of development.',
    iconName: 'Shield',
  },
  {
    title: 'Premium UI/UX',
    description:
      'Research-driven interfaces and design systems that improve adoption, reduce friction, and strengthen brand trust across every touchpoint.',
    iconName: 'Layout',
  },
  {
    title: 'AI automation expertise',
    description:
      'LLM integrations, intelligent workflows, and automation that save time — deployed responsibly with evaluation, monitoring, and governance.',
    iconName: 'Brain',
  },
]

const FALLBACK_CONTACT_TRUST = [
  { iconName: 'Clock', text: 'Response within 1 business day' },
  { iconName: 'Shield', text: 'NDA & enterprise security practices' },
  {
    iconName: 'Sparkles',
    text: 'Premium engineering execution powered by modern AI systems',
  },
]

const FALLBACK_PROCESS_ICON_NAMES = [
  'Search',
  'Compass',
  'Palette',
  'Code2',
  'FlaskConical',
  'Rocket',
]

const techColorLookup = new Map(
  [...technologiesRowA, ...technologiesRowB].map(({ name, color }) => [name, color])
)

function textOrFallback(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function stringArrayOrFallback(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
  return items.length > 0 ? items : fallback
}

function configOf(section: Record<string, unknown> | undefined): Record<string, unknown> {
  return section?.config && typeof section.config === 'object'
    ? (section.config as Record<string, unknown>)
    : {}
}

/**
 * Serializable Home payload — mirrors Vite `buildPublicHomePage` without Vite supabase/media imports.
 */
export function buildNextSerializableHomePage(
  page: Record<string, unknown> | null | undefined,
  sectionRows: Record<string, unknown>[] | null | undefined,
  seoRow: Record<string, unknown> | null = null
): SerializableHomePage {
  const sectionMap = Object.fromEntries(
    (sectionRows ?? []).map((row) => [String(row.section_key), row])
  )

  const hero = sectionMap.hero
  const services = sectionMap.services
  const why = sectionMap['why-choose']
  const stats = sectionMap.stats
  const process = sectionMap.process
  const technologies = sectionMap.technologies
  const contact = sectionMap.contact

  const heroConfig = configOf(hero)
  const servicesConfig = configOf(services)
  const whyConfig = configOf(why)
  const statsConfig = configOf(stats)
  const processConfig = configOf(process)
  const techConfig = configOf(technologies)
  const contactConfig = configOf(contact)

  const backgroundPath = String(heroConfig.background_image_path ?? '').trim()
  const servicesImagePath = String(servicesConfig.image_path ?? '').trim()

  const whyItemsRaw = Array.isArray(whyConfig.items) ? whyConfig.items : []
  const whyItems =
    whyItemsRaw.length > 0
      ? whyItemsRaw
          .map((item, index) => {
            if (!item || typeof item !== 'object') return null
            const source = item as Record<string, unknown>
            const fallback = FALLBACK_WHY_ITEMS[index] ?? FALLBACK_WHY_ITEMS[0]
            return {
              title: textOrFallback(source.title, fallback.title),
              description: textOrFallback(source.description, fallback.description),
              iconName: textOrFallback(source.icon_name, fallback.iconName),
            }
          })
          .filter(Boolean) as Array<{ title: string; description: string; iconName: string }>
      : FALLBACK_WHY_ITEMS

  const statsRaw = Array.isArray(statsConfig.stats) ? statsConfig.stats : []
  const normalizedStats =
    statsRaw.length > 0
      ? statsRaw
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const source = item as Record<string, unknown>
            const label = String(source.label ?? '').trim()
            if (!label) return null
            return {
              value: Number(source.value) || 0,
              suffix: String(source.suffix ?? ''),
              label,
            }
          })
          .filter(Boolean) as Array<{ value: number; suffix: string; label: string }>
      : companyStats.map((s) => ({
          value: s.value,
          suffix: s.suffix,
          label: s.label,
        }))

  const stepsRaw = Array.isArray(processConfig.steps) ? processConfig.steps : []
  const steps =
    stepsRaw.length > 0
      ? stepsRaw
          .map((item, index) => {
            if (!item || typeof item !== 'object') return null
            const source = item as Record<string, unknown>
            const fallback = homeProcessSteps[index] ?? homeProcessSteps[0]
            return {
              step: textOrFallback(source.step, fallback.step),
              title: textOrFallback(source.title, fallback.title),
              text: textOrFallback(source.text, fallback.text),
            }
          })
          .filter(Boolean) as Array<{ step: string; title: string; text: string }>
      : homeProcessSteps.map((s) => ({ step: s.step, title: s.title, text: s.text }))

  const techNamesA = stringArrayOrFallback(
    techConfig.row_a,
    technologiesRowA.map((t) => t.name)
  )
  const techNamesB = stringArrayOrFallback(
    techConfig.row_b,
    technologiesRowB.map((t) => t.name)
  )

  const trustRaw = Array.isArray(contactConfig.trust_items) ? contactConfig.trust_items : []
  const trustItems =
    trustRaw.length > 0
      ? trustRaw
          .map((item, index) => {
            if (!item || typeof item !== 'object') return null
            const source = item as Record<string, unknown>
            const fallback = FALLBACK_CONTACT_TRUST[index] ?? FALLBACK_CONTACT_TRUST[0]
            return {
              iconName: textOrFallback(source.icon_name, fallback.iconName),
              text: textOrFallback(source.text, fallback.text),
            }
          })
          .filter(Boolean) as Array<{ iconName: string; text: string }>
      : FALLBACK_CONTACT_TRUST

  return {
    page: {
      slug: textOrFallback(page?.slug, 'home'),
      title: textOrFallback(page?.title, 'Home'),
      route_path: textOrFallback(page?.route_path, '/'),
      status: textOrFallback(page?.status, 'published'),
      excerpt: textOrFallback(seoRow?.page_description, String(page?.excerpt ?? '')),
    },
    seo: {
      metaTitle: textOrFallback(
        seoRow?.meta_title,
        'FlaireStack | AI-First Software Development Studio'
      ),
      metaDescription: textOrFallback(
        seoRow?.meta_description,
        'FlaireStack is an AI-first software development studio delivering custom applications, cloud-native platforms, and intelligent automation.'
      ),
      pageDescription: textOrFallback(
        seoRow?.page_description,
        String(page?.excerpt ?? '')
      ),
      row: (seoRow as Record<string, unknown> | null) ?? null,
    },
    sections: {
      hero: {
        title: textOrFallback(hero?.title, 'Building intelligent'),
        titleAccent: textOrFallback(hero?.title_accent, 'digital experiences'),
        intro: textOrFallback(hero?.intro, 'for the future.'),
        body: textOrFallback(
          hero?.body,
          'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.'
        ),
        ctaLabel: textOrFallback(hero?.cta_primary_label, 'Book Consultation'),
        ctaUrl: textOrFallback(hero?.cta_primary_url, '#contact'),
        backgroundImageUrl: backgroundPath ? getPublicMediaUrl(backgroundPath) : null,
        useBundledBackground: !backgroundPath,
      },
      services: {
        eyebrow: textOrFallback(services?.eyebrow, 'Our services'),
        title: textOrFallback(services?.title, 'Redefining'),
        titleAccent: textOrFallback(services?.title_accent, 'digital impact'),
        intro: textOrFallback(services?.intro, 'across the globe.'),
        body: textOrFallback(
          services?.body,
          'From AI-native platforms to cloud infrastructure — we partner with ambitious teams to design, build, and scale products that feel cinematic, resilient, and ready for enterprise.'
        ),
        ctaLabel: textOrFallback(services?.cta_primary_label, 'Get in touch'),
        ctaUrl: textOrFallback(services?.cta_primary_url, '#contact'),
        panelLabel: textOrFallback(servicesConfig.panel_label, 'Why FlaireStack'),
        visualAlt: textOrFallback(
          servicesConfig.visual_alt,
          'FlaireStack service platform: code, AI, cloud, and analytics connected'
        ),
        visualImageUrl: servicesImagePath ? getPublicMediaUrl(servicesImagePath) : null,
        useBundledVisual: !servicesImagePath,
        details: stringArrayOrFallback(servicesConfig.details, [
          'We embed expert product engineers, cloud architects, and AI specialists into your roadmap to reduce delivery risk, accelerate release velocity, and improve platform reliability at scale.',
          'Whether you are launching a new product, modernizing legacy systems, or scaling AI across operations, we work as an extension of your team — with transparent sprints, senior ownership, and delivery tied to business outcomes.',
        ]),
        points: stringArrayOrFallback(servicesConfig.points, [
          'Enterprise-grade architecture and governance',
          'Product-led UX with measurable conversion impact',
          'Continuous delivery with quality and security by design',
          'Cloud-native infrastructure, FinOps, and observability',
          'AI integration, automation, and intelligent workflows',
        ]),
      },
      'why-choose': {
        eyebrow: textOrFallback(why?.eyebrow, 'The FlaireStack difference'),
        title: textOrFallback(why?.title, 'Why choose'),
        titleAccent: textOrFallback(why?.title_accent, 'FlaireStack'),
        intro: textOrFallback(
          why?.intro,
          'Partner with a software development team that combines senior engineering, premium design, and AI-native thinking — so your product ships faster, scales reliably, and wins in the market.'
        ),
        items: whyItems,
      },
      stats: { stats: normalizedStats },
      process: {
        eyebrow: textOrFallback(process?.eyebrow, 'How we deliver'),
        title: textOrFallback(process?.title, 'Our'),
        titleAccent: textOrFallback(process?.title_accent, 'Process'),
        intro: textOrFallback(
          process?.intro,
          'A proven six-step framework that keeps projects transparent, on schedule, and built for long-term success — from first workshop to production scale.'
        ),
        steps,
        iconNames: stringArrayOrFallback(processConfig.icons, FALLBACK_PROCESS_ICON_NAMES),
      },
      technologies: {
        eyebrow: textOrFallback(technologies?.eyebrow, 'Tech stack'),
        title: textOrFallback(technologies?.title, 'Technologies we'),
        titleAccent: textOrFallback(technologies?.title_accent, 'work with'),
        intro: textOrFallback(
          technologies?.intro,
          'Modern frameworks, clouds, databases, and AI platforms — integrated with the tools your teams already use.'
        ),
        rowA: techNamesA.map((name) => ({
          name,
          color: techColorLookup.get(name),
        })),
        rowB: techNamesB.map((name) => ({
          name,
          color: techColorLookup.get(name),
        })),
      },
      contact: {
        eyebrow: textOrFallback(contact?.eyebrow, 'Start a project'),
        title: textOrFallback(contact?.title, "Let's Build Something"),
        titleAccent: textOrFallback(contact?.title_accent, 'Exceptional Together'),
        body: textOrFallback(
          contact?.body,
          'Partner with FlaireStack for cinematic digital products engineered with precision — from intelligent automation to mission-critical platforms that scale globally.'
        ),
        capabilities: stringArrayOrFallback(contactConfig.capabilities, [
          'AI solutions',
          'Enterprise software',
          'Scalable digital products',
          'Cloud systems',
          'Custom development services',
        ]),
        trustItems,
      },
    },
  }
}

export const FALLBACK_NEXT_HOME = buildNextSerializableHomePage(null, [], null)
