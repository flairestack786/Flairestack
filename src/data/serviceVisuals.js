import alts from './serviceImageAlts.json'

const img = (slug, slot, title) => ({
  src: `/images/services/${slug}/${slot}.webp`,
  alt: alts[slug]?.[slot] ?? `${title} — ${slot.replace(/([0-9])/, ' $1')}`,
})

/** Services whose framework section renders five rows */
const FIVE_FRAMEWORK_SLUGS = new Set([
  'web-development',
  'ai-development',
  'software-development',
  'mobile-app-development',
])

/**
 * Maps each visible page region to a distinct image slot.
 * Hero carousel, framework rows, section images, and CTA backgrounds never share assets.
 */
export function buildVisualsForService(slug, title) {
  const mk = (slot) => img(slug, slot, title)
  const frameworkCount = FIVE_FRAMEWORK_SLUGS.has(slug) ? 5 : 4
  const frameworkSlots =
    frameworkCount === 5
      ? ['framework1', 'framework2', 'framework3', 'framework4', 'framework5']
      : ['framework1', 'framework2', 'framework3', 'framework4']

  return {
    hero: mk('hero'),
    overview: mk('overview'),
    banner: mk('banner'),
    features: mk('features'),
    tech: mk('tech'),
    process: mk('process'),
    benefits: mk('benefits'),
    cta: mk('cta'),
    framework: frameworkSlots.map((slot) => mk(slot)),
    capabilityImages: [
      mk('features'),
      mk('benefits'),
      mk('cta'),
      mk('tech'),
      mk('process'),
      mk('framework5'),
    ],
    contentSections: {
      clientBenefits: mk('clientBenefits'),
      implementationApproach: mk('implementationApproach'),
      businessOutcomes: mk('businessOutcomes'),
    },
    testimonialsBackground: mk('clientBenefits'),
    finalCtaBackground: mk('businessOutcomes'),
  }
}
