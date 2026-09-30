/**
 * Next-serializable public About page builder.
 * Mirrors Vite `buildPublicAboutPage` but stores `iconName` (no Lucide components)
 * and resolves media via `getPublicMediaUrl`.
 */
import { founders, companyMission } from '@/data/founders'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'

const ABOUT_SLUG = 'about'

/** Next may type PNG imports as StaticImageData; Vite uses string URL. */
function resolveBundledImageUrl(image: unknown): string {
  if (typeof image === 'string') return image
  if (image && typeof image === 'object' && 'src' in image) {
    return String((image as { src: string }).src)
  }
  return ''
}

const FALLBACK_FOUNDERS = founders.map((founder) => ({
  id: founder.id,
  name: founder.name,
  title: founder.title,
  bio: founder.bio,
  imageAlt: founder.imageAlt,
  imagePosition: founder.imagePosition,
  bundledImage: resolveBundledImageUrl(founder.image),
}))

const FALLBACK_VALUES = [
  {
    title: 'AI-first engineering',
    text: 'We integrate machine learning, automation, and intelligent workflows into products built for real-world scale.',
    iconName: 'Sparkles',
  },
  {
    title: 'Design-led delivery',
    text: 'Human-centered UI/UX and conversion-focused interfaces that help users adopt and trust your product faster.',
    iconName: 'Target',
  },
  {
    title: 'Ship with confidence',
    text: 'Agile sprints, security best practices, and DevOps pipelines that take ideas from discovery to production reliably.',
    iconName: 'Zap',
  },
]

const FALLBACK_STATS = [
  {
    value: '60+',
    label: 'Projects delivered',
    description:
      'End-to-end web development, software engineering, mobile apps, and AI solutions launched for startups and enterprise teams worldwide.',
    iconName: 'Briefcase',
  },
  {
    value: '25+',
    label: 'Clients partnered',
    description:
      'Long-term partnerships across SaaS, fintech, healthcare, and e-commerce — with transparent delivery and measurable business outcomes.',
    iconName: 'Users',
  },
  {
    value: '5+',
    label: 'Years of expertise',
    description:
      'Senior engineers, designers, and strategists with deep experience in cloud architecture, UX, and production-grade product development.',
    iconName: 'Award',
  },
  {
    value: '3',
    label: 'Countries served',
    description:
      'Remote-first delivery supporting organizations in North America, Europe, the Middle East, and beyond with 24/7 collaboration options.',
    iconName: 'Globe',
  },
]

function textOrFallback(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

export type SerializableAboutPage = {
  page: {
    slug: string
    title: string
    route_path: string
    status: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    pageDescription: string
    row: Record<string, unknown> | null
  }
  sections: {
    hero: {
      eyebrow: string
      title: string
      titleAccent: string
      intro: string
    }
    'company-story': {
      eyebrow: string
      title: string
      titleAccent: string
      body: string
      stats: Array<{
        value: string
        label: string
        description: string
        iconName: string
      }>
    }
    mission: {
      eyebrow: string
      title: string
      titleAccent: string
      body: string
    }
    vision: {
      eyebrow: string
      title: string
      titleAccent: string
      body: string
    }
    values: {
      eyebrow: string
      title: string
      titleAccent: string
      items: Array<{ title: string; text: string; iconName: string }>
    }
    team: {
      eyebrow: string
      title: string
      titleAccent: string
      members: Array<{
        id: string
        name: string
        title: string
        bio: string
        imageAlt: string
        imagePosition: string
        imageUrl: string
        useBundledImage: boolean
      }>
    }
    contact: {
      eyebrow: string
      title: string
      titleAccent: string
      body: string
      ctaLabel: string
      ctaUrl: string
    }
  }
}

export const FALLBACK_NEXT_ABOUT: SerializableAboutPage = {
  page: {
    slug: ABOUT_SLUG,
    title: 'About',
    route_path: '/about',
    status: 'published',
  },
  seo: {
    metaTitle: 'About Us | FlaireStack',
    metaDescription:
      'Meet the FlaireStack team — an AI-first software studio helping ambitious organizations design, build, and scale digital products with senior engineering, premium design, and transparent delivery.',
    pageDescription: '',
    row: null,
  },
  sections: {
    hero: {
      eyebrow: 'About us',
      title: 'The team behind',
      titleAccent: 'FlaireStack',
      intro:
        'We are an AI-first software studio helping ambitious organizations design, build, and scale digital products with senior engineering, premium design, and transparent delivery.',
    },
    'company-story': {
      eyebrow: 'Who we are',
      title: 'About',
      titleAccent: 'FlaireStack',
      body: 'FlaireStack is an AI-first software development company specializing in custom web applications, enterprise software, mobile apps, cloud strategy, and intelligent automation — helping ambitious teams build scalable digital products that drive growth.',
      stats: FALLBACK_STATS,
    },
    mission: {
      eyebrow: 'Our mission',
      title: 'Building digital experiences that',
      titleAccent: 'drive growth',
      body: companyMission,
    },
    vision: {
      eyebrow: 'Our vision',
      title: 'Software that performs',
      titleAccent: 'in production',
      body: 'We blend artificial intelligence with world-class engineering to help organizations design, build, and scale software that performs in production — not just in presentations.',
    },
    values: {
      eyebrow: 'What we stand for',
      title: 'Our',
      titleAccent: 'values',
      items: FALLBACK_VALUES,
    },
    team: {
      eyebrow: 'Leadership',
      title: 'Meet our',
      titleAccent: 'co-founders',
      members: FALLBACK_FOUNDERS.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        bio: member.bio,
        imageAlt: member.imageAlt,
        imagePosition: member.imagePosition,
        imageUrl: member.bundledImage,
        useBundledImage: true,
      })),
    },
    contact: {
      eyebrow: 'Get in touch',
      title: "Let's build something",
      titleAccent: 'great together',
      body: 'Ready to partner with a senior team on your next product, platform, or AI initiative? Tell us about your goals and we will respond within one business day.',
      ctaLabel: 'Start a project',
      ctaUrl: '/#contact',
    },
  },
}

function normalizeTeamMembers(
  items: unknown,
  fallback: typeof FALLBACK_FOUNDERS
): SerializableAboutPage['sections']['team']['members'] {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback.map((member) => ({
      id: member.id,
      name: member.name,
      title: member.title,
      bio: member.bio,
      imageAlt: member.imageAlt,
      imagePosition: member.imagePosition,
      imageUrl: member.bundledImage,
      useBundledImage: true,
    }))
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const fallbackMember = fallback[index] ?? fallback[0]
      const imagePath = String(source.image_path ?? '').trim()
      const resolved = imagePath ? getPublicMediaUrl(imagePath) : null

      return {
        id: textOrFallback(source.id, fallbackMember.id),
        name: textOrFallback(source.name, fallbackMember.name),
        title: textOrFallback(source.title, fallbackMember.title),
        bio: textOrFallback(source.bio, fallbackMember.bio),
        imageAlt: textOrFallback(source.image_alt, fallbackMember.imageAlt),
        imagePosition: textOrFallback(source.image_position, fallbackMember.imagePosition),
        imageUrl: resolved || fallbackMember.bundledImage,
        useBundledImage: !imagePath,
      }
    })
    .filter(Boolean) as SerializableAboutPage['sections']['team']['members']

  return normalized.length > 0
    ? normalized
    : fallback.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        bio: member.bio,
        imageAlt: member.imageAlt,
        imagePosition: member.imagePosition,
        imageUrl: member.bundledImage,
        useBundledImage: true,
      }))
}

function normalizeValueItems(
  items: unknown,
  fallback: typeof FALLBACK_VALUES
): SerializableAboutPage['sections']['values']['items'] {
  if (!Array.isArray(items) || items.length === 0) return fallback

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const fallbackItem = fallback[index] ?? fallback[0]
      return {
        title: textOrFallback(source.title, fallbackItem.title),
        text: textOrFallback(source.text, fallbackItem.text),
        iconName: textOrFallback(source.icon_name, fallbackItem.iconName),
      }
    })
    .filter(Boolean) as SerializableAboutPage['sections']['values']['items']

  return normalized.length > 0 ? normalized : fallback
}

function normalizeStoryStats(
  items: unknown,
  fallback: typeof FALLBACK_STATS
): SerializableAboutPage['sections']['company-story']['stats'] {
  if (!Array.isArray(items) || items.length === 0) return fallback

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const fallbackStat = fallback[index] ?? fallback[0]
      return {
        value: textOrFallback(source.value, fallbackStat.value),
        label: textOrFallback(source.label, fallbackStat.label),
        description: textOrFallback(source.description, fallbackStat.description),
        iconName: textOrFallback(source.icon_name, fallbackStat.iconName),
      }
    })
    .filter(Boolean) as SerializableAboutPage['sections']['company-story']['stats']

  return normalized.length > 0 ? normalized : fallback
}

export function buildNextSerializableAboutPage(
  page: Record<string, unknown> | null | undefined,
  sectionRows: Record<string, unknown>[],
  seoRow: Record<string, unknown> | null | undefined
): SerializableAboutPage {
  const fallback = FALLBACK_NEXT_ABOUT
  const sectionMap = Object.fromEntries(
    (sectionRows ?? []).map((row) => [String(row.section_key), row])
  )

  const heroSection = sectionMap.hero
  const storySection = sectionMap['company-story']
  const missionSection = sectionMap.mission
  const visionSection = sectionMap.vision
  const valuesSection = sectionMap.values
  const teamSection = sectionMap.team
  const contactSection = sectionMap.contact

  const storyConfig =
    storySection?.config && typeof storySection.config === 'object'
      ? (storySection.config as Record<string, unknown>)
      : {}
  const valuesConfig =
    valuesSection?.config && typeof valuesSection.config === 'object'
      ? (valuesSection.config as Record<string, unknown>)
      : {}
  const teamConfig =
    teamSection?.config && typeof teamSection.config === 'object'
      ? (teamSection.config as Record<string, unknown>)
      : {}

  return {
    page: {
      slug: textOrFallback(page?.slug, fallback.page.slug),
      title: textOrFallback(page?.title, fallback.page.title),
      route_path: textOrFallback(page?.route_path, fallback.page.route_path),
      status: textOrFallback(page?.status, fallback.page.status),
    },
    seo: {
      metaTitle: textOrFallback(seoRow?.meta_title, fallback.seo.metaTitle),
      metaDescription: textOrFallback(seoRow?.meta_description, fallback.seo.metaDescription),
      pageDescription: textOrFallback(
        seoRow?.page_description,
        String(page?.excerpt ?? '')
      ),
      row: (seoRow as Record<string, unknown> | null) ?? null,
    },
    sections: {
      hero: {
        eyebrow: textOrFallback(heroSection?.eyebrow, fallback.sections.hero.eyebrow),
        title: textOrFallback(heroSection?.title, fallback.sections.hero.title),
        titleAccent: textOrFallback(heroSection?.title_accent, fallback.sections.hero.titleAccent),
        intro: textOrFallback(heroSection?.intro, fallback.sections.hero.intro),
      },
      'company-story': {
        eyebrow: textOrFallback(storySection?.eyebrow, fallback.sections['company-story'].eyebrow),
        title: textOrFallback(storySection?.title, fallback.sections['company-story'].title),
        titleAccent: textOrFallback(
          storySection?.title_accent,
          fallback.sections['company-story'].titleAccent
        ),
        body: textOrFallback(storySection?.body, fallback.sections['company-story'].body),
        stats: normalizeStoryStats(storyConfig.stats, fallback.sections['company-story'].stats),
      },
      mission: {
        eyebrow: textOrFallback(missionSection?.eyebrow, fallback.sections.mission.eyebrow),
        title: textOrFallback(missionSection?.title, fallback.sections.mission.title),
        titleAccent: textOrFallback(
          missionSection?.title_accent,
          fallback.sections.mission.titleAccent
        ),
        body: textOrFallback(missionSection?.body, fallback.sections.mission.body),
      },
      vision: {
        eyebrow: textOrFallback(visionSection?.eyebrow, fallback.sections.vision.eyebrow),
        title: textOrFallback(visionSection?.title, fallback.sections.vision.title),
        titleAccent: textOrFallback(
          visionSection?.title_accent,
          fallback.sections.vision.titleAccent
        ),
        body: textOrFallback(visionSection?.body, fallback.sections.vision.body),
      },
      values: {
        eyebrow: textOrFallback(valuesSection?.eyebrow, fallback.sections.values.eyebrow),
        title: textOrFallback(valuesSection?.title, fallback.sections.values.title),
        titleAccent: textOrFallback(
          valuesSection?.title_accent,
          fallback.sections.values.titleAccent
        ),
        items: normalizeValueItems(valuesConfig.items, fallback.sections.values.items),
      },
      team: {
        eyebrow: textOrFallback(teamSection?.eyebrow, fallback.sections.team.eyebrow),
        title: textOrFallback(teamSection?.title, fallback.sections.team.title),
        titleAccent: textOrFallback(teamSection?.title_accent, fallback.sections.team.titleAccent),
        members: normalizeTeamMembers(teamConfig.members, FALLBACK_FOUNDERS),
      },
      contact: {
        eyebrow: textOrFallback(contactSection?.eyebrow, fallback.sections.contact.eyebrow),
        title: textOrFallback(contactSection?.title, fallback.sections.contact.title),
        titleAccent: textOrFallback(
          contactSection?.title_accent,
          fallback.sections.contact.titleAccent
        ),
        body: textOrFallback(contactSection?.body, fallback.sections.contact.body),
        ctaLabel: textOrFallback(
          contactSection?.cta_primary_label,
          fallback.sections.contact.ctaLabel
        ),
        ctaUrl: textOrFallback(contactSection?.cta_primary_url, fallback.sections.contact.ctaUrl),
      },
    },
  }
}
