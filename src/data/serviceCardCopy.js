/**
 * Concise homepage card copy keyed by service slug.
 * Used only when CMS `short_description` is empty — CMS remains source of truth.
 */
export const SERVICE_CARD_DESCRIPTION_FALLBACKS = Object.freeze({
  'web-development':
    'Responsive, high-performance websites engineered around business goals, usability, and measurable conversions.',
  'software-development':
    'Custom software applications designed around operational requirements, scalability, and long-term maintainability.',
  'domain-hosting':
    'Reliable domain, DNS, and hosting setups focused on uptime, security, and fast global delivery.',
  'software-quality-assurance':
    'Structured testing and quality engineering to identify defects, reduce risk, and improve release confidence.',
  'mobile-app-development':
    'Mobile experiences designed for intuitive navigation, dependable performance, and real-world user needs.',
  'it-consultancy':
    'Practical technology guidance that aligns systems, teams, and roadmaps with clear business priorities.',
  'database-development':
    'Data models, migrations, and performance tuning that keep critical systems reliable and ready to grow.',
  'e-commerce-website-development':
    'Online storefronts built around product discovery, checkout usability, and business growth.',
  'cloud-strategy':
    'Cloud architecture, modernization, and deployment planning focused on resilience, security, and cost efficiency.',
  'ai-development':
    'AI-powered applications and workflows that automate repetitive tasks and improve decision-making.',
  'data-analytics':
    'Data pipelines, reporting, and analytics solutions that turn business data into actionable insights.',
  'business-process-services':
    'Workflow design and process automation that reduce manual work and improve day-to-day operational flow.',
  'digital-marketing':
    'Focused digital campaigns and content strategies that strengthen visibility, engagement, and qualified demand.',
  'graphic-design':
    'Brand-aligned visual design for digital and marketing assets that communicate clearly and look polished.',
  'ui-ux-design':
    'User research, interaction design, and polished interfaces that make digital products easier to use.',
  'game-development':
    'Interactive game experiences crafted for engaging play, solid performance, and scalable technical foundations.',
  'saas-development':
    'Subscription-based software products designed for maintainability, secure access, and future expansion.',
  'saas-development-service':
    'Subscription-based software products designed for maintainability, secure access, and future expansion.',
  'saas-development-services':
    'Subscription-based software products designed for maintainability, secure access, and future expansion.',
})

/** Stale CMS copy left after Business Process Services → SaaS rename. */
const STALE_BPS_DESCRIPTIONS = new Set([
  'Workflow automation and process optimization for operational efficiency.',
  SERVICE_CARD_DESCRIPTION_FALLBACKS['business-process-services'],
])

/**
 * @param {string} slug
 * @param {string} [cmsDescription]
 * @param {string} [title]
 * @returns {string}
 */
export function resolveServiceCardDescription(slug, cmsDescription = '', title = '') {
  const fromCms = String(cmsDescription ?? '').trim()
  const key = String(slug ?? '').trim().toLowerCase()
  const titleLower = String(title ?? '').trim().toLowerCase()
  const isSaas =
    key.includes('saas') || titleLower.includes('saas development')

  if (isSaas && (!fromCms || STALE_BPS_DESCRIPTIONS.has(fromCms))) {
    return SERVICE_CARD_DESCRIPTION_FALLBACKS['saas-development']
  }

  if (fromCms) return fromCms
  return (
    SERVICE_CARD_DESCRIPTION_FALLBACKS[key] ??
    (titleLower.includes('saas')
      ? SERVICE_CARD_DESCRIPTION_FALLBACKS['saas-development']
      : '')
  )
}
