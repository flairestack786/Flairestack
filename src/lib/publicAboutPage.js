import { Award, Briefcase, Globe, Sparkles, Target, Users, Zap } from 'lucide-react'
import { founders, companyMission } from '../data/founders'
import { resolveLucideIcon } from './lucideIcons'
import { getPublicUrl } from './media'
import { supabase } from './supabase'
import { PUBLIC_SEO_SELECT } from './publicSeo'

const ABOUT_SLUG = 'about'

const FALLBACK_FOUNDERS = founders.map((founder) => ({
  id: founder.id,
  name: founder.name,
  title: founder.title,
  bio: founder.bio,
  imageAlt: founder.imageAlt,
  imagePosition: founder.imagePosition,
  bundledImage: founder.image,
}))

const FALLBACK_VALUES = [
  {
    title: 'AI-first engineering',
    text: 'We integrate machine learning, automation, and intelligent workflows into products built for real-world scale.',
    iconName: 'Sparkles',
    Icon: Sparkles,
  },
  {
    title: 'Design-led delivery',
    text: 'Human-centered UI/UX and conversion-focused interfaces that help users adopt and trust your product faster.',
    iconName: 'Target',
    Icon: Target,
  },
  {
    title: 'Ship with confidence',
    text: 'Agile sprints, security best practices, and DevOps pipelines that take ideas from discovery to production reliably.',
    iconName: 'Zap',
    Icon: Zap,
  },
]

const FALLBACK_STATS = [
  {
    value: '60+',
    label: 'Projects delivered',
    description:
      'End-to-end web development, software engineering, mobile apps, and AI solutions launched for startups and enterprise teams worldwide.',
    iconName: 'Briefcase',
    Icon: Briefcase,
  },
  {
    value: '25+',
    label: 'Clients partnered',
    description:
      'Long-term partnerships across SaaS, fintech, healthcare, and e-commerce — with transparent delivery and measurable business outcomes.',
    iconName: 'Users',
    Icon: Users,
  },
  {
    value: '5+',
    label: 'Years of expertise',
    description:
      'Senior engineers, designers, and strategists with deep experience in cloud architecture, UX, and production-grade product development.',
    iconName: 'Award',
    Icon: Award,
  },
  {
    value: '3',
    label: 'Countries served',
    description:
      'Remote-first delivery supporting organizations in North America, Europe, the Middle East, and beyond with 24/7 collaboration options.',
    iconName: 'Globe',
    Icon: Globe,
  },
]

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
 * @param {unknown} items
 * @param {typeof FALLBACK_FOUNDERS} fallback
 */
function normalizeTeamMembers(items, fallback) {
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
      const source = /** @type {{ id?: string, name?: string, title?: string, bio?: string, image_alt?: string, image_position?: string, image_path?: string | null }} */ (
        item
      )
      const fallbackMember = fallback[index] ?? fallback[0]
      const imagePath = String(source.image_path ?? '').trim()

      return {
        id: textOrFallback(source.id, fallbackMember.id),
        name: textOrFallback(source.name, fallbackMember.name),
        title: textOrFallback(source.title, fallbackMember.title),
        bio: textOrFallback(source.bio, fallbackMember.bio),
        imageAlt: textOrFallback(source.image_alt, fallbackMember.imageAlt),
        imagePosition: textOrFallback(source.image_position, fallbackMember.imagePosition),
        imageUrl: imagePath ? getPublicUrl(imagePath) : fallbackMember.bundledImage,
        useBundledImage: !imagePath,
      }
    })
    .filter(Boolean)

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

/**
 * @param {unknown} items
 * @param {typeof FALLBACK_VALUES} fallback
 */
function normalizeValueItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ title?: string, text?: string, icon_name?: string }} */ (item)
      const fallbackItem = fallback[index] ?? fallback[0]
      const iconName = textOrFallback(source.icon_name, fallbackItem.iconName)
      return {
        title: textOrFallback(source.title, fallbackItem.title),
        text: textOrFallback(source.text, fallbackItem.text),
        iconName,
        Icon: resolveLucideIcon(iconName, fallbackItem.Icon),
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/** Default public About page content used while loading or when CMS data is unavailable. */
export const FALLBACK_PUBLIC_ABOUT = {
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

/**
 * @param {unknown} items
 * @param {typeof FALLBACK_STATS} fallback
 */
function normalizeStoryStats(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = /** @type {{ value?: string, label?: string, description?: string, icon_name?: string }} */ (
        item
      )
      const fallbackStat = fallback[index] ?? fallback[0]
      const iconName = textOrFallback(source.icon_name, fallbackStat.iconName)
      return {
        value: textOrFallback(source.value, fallbackStat.value),
        label: textOrFallback(source.label, fallbackStat.label),
        description: textOrFallback(source.description, fallbackStat.description),
        iconName,
        Icon: resolveLucideIcon(iconName, fallbackStat.Icon),
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

/**
 * @param {Record<string, unknown> | null | undefined} page
 * @param {Record<string, unknown>[]} sectionRows
 * @param {Record<string, unknown> | null | undefined} seoRow
 * @returns {typeof FALLBACK_PUBLIC_ABOUT}
 */
export function buildPublicAboutPage(page, sectionRows, seoRow) {
  const fallback = FALLBACK_PUBLIC_ABOUT
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
      ? /** @type {Record<string, unknown>} */ (storySection.config)
      : {}
  const valuesConfig =
    valuesSection?.config && typeof valuesSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (valuesSection.config)
      : {}
  const teamConfig =
    teamSection?.config && typeof teamSection.config === 'object'
      ? /** @type {Record<string, unknown>} */ (teamSection.config)
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
      pageDescription: textOrFallback(seoRow?.page_description, page?.excerpt ?? ''),
      row: seoRow ?? null,
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
        titleAccent: textOrFallback(visionSection?.title_accent, fallback.sections.vision.titleAccent),
        body: textOrFallback(visionSection?.body, fallback.sections.vision.body),
      },
      values: {
        eyebrow: textOrFallback(valuesSection?.eyebrow, fallback.sections.values.eyebrow),
        title: textOrFallback(valuesSection?.title, fallback.sections.values.title),
        titleAccent: textOrFallback(valuesSection?.title_accent, fallback.sections.values.titleAccent),
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

/**
 * Load the published About page, enabled sections, and SEO row for the public site.
 * @returns {Promise<{ page: Record<string, unknown>, sections: Record<string, unknown>[], seo: Record<string, unknown> | null } | null>}
 */
export async function fetchPublishedAboutPage() {
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', ABOUT_SLUG)
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

  const { data: seo, error: seoError } = await supabase
    .from('seo_metadata')
    .select(PUBLIC_SEO_SELECT)
    .eq('page_id', page.id)
    .maybeSingle()

  if (seoError) {
    throw seoError
  }

  return { page, sections: sections ?? [], seo }
}
