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

/**
 * Homepage alternating-feature copy keyed by slug.
 * Accent is the bold second phrase; highlights power the checklist.
 */
export const SERVICE_SHOWCASE_COPY = Object.freeze({
  'web-development': {
    accent: 'built for conversion',
    ctaLabel: 'Build with us',
    highlights: [
      'Custom Web Platforms',
      'Performance & Core Web Vitals',
      'SEO & Accessibility',
      'Design System Integration',
    ],
  },
  'software-development': {
    accent: 'engineered to scale',
    ctaLabel: 'Build software',
    highlights: [
      'Custom Applications',
      'API & Integrations',
      'Cloud-Native Architecture',
      'Long-term Maintainability',
    ],
  },
  'domain-hosting': {
    accent: 'tuned for uptime',
    ctaLabel: 'Launch hosting',
    highlights: ['Domain & DNS', 'Managed Hosting', 'SSL & Security', 'Global Delivery'],
  },
  'software-quality-assurance': {
    accent: 'built for release confidence',
    ctaLabel: 'Improve quality',
    highlights: [
      'Automated Testing',
      'Manual Exploratory QA',
      'Performance Testing',
      'Release Gates',
    ],
  },
  'mobile-app-development': {
    accent: 'designed for real users',
    ctaLabel: 'Build apps',
    highlights: ['iOS & Android', 'Cross-Platform Apps', 'App Store Launch', 'Ongoing Support'],
  },
  'it-consultancy': {
    accent: 'aligned to business goals',
    ctaLabel: 'Talk strategy',
    highlights: [
      'Technology Roadmaps',
      'Architecture Reviews',
      'Team Augmentation',
      'Delivery Playbooks',
    ],
  },
  'database-development': {
    accent: 'ready for growth',
    ctaLabel: 'Design data',
    highlights: [
      'Schema Design',
      'Performance Tuning',
      'Migrations & ETL',
      'Data Governance',
    ],
  },
  'e-commerce-website-development': {
    accent: 'built to convert',
    ctaLabel: 'Build stores',
    highlights: [
      'Storefront UX',
      'Checkout Optimization',
      'Payments & Catalog',
      'Growth Analytics',
    ],
  },
  'cloud-strategy': {
    accent: 'resilient by design',
    ctaLabel: 'Plan cloud',
    highlights: [
      'Cloud Architecture',
      'Migration Planning',
      'Cost Optimization',
      'Security & Compliance',
    ],
  },
  'ai-development': {
    accent: 'around your business',
    ctaLabel: 'Build AI',
    highlights: [
      'LLM Applications',
      'Workflow Automation',
      'RAG & Knowledge Systems',
      'Production Guardrails',
    ],
  },
  'data-analytics': {
    accent: 'that drive decisions',
    ctaLabel: 'Unlock data',
    highlights: [
      'Data Pipelines',
      'Dashboards & Reporting',
      'Predictive Insights',
      'Self-Serve Analytics',
    ],
  },
  'business-process-services': {
    accent: 'that remove busywork',
    ctaLabel: 'Streamline work',
    highlights: [
      'Workflow Design',
      'Process Automation',
      'Ops Tooling',
      'Continuous Improvement',
    ],
  },
  'digital-marketing': {
    accent: 'that compounds demand',
    ctaLabel: 'Grow demand',
    highlights: [
      'Campaign Strategy',
      'Content Systems',
      'SEO & Paid Media',
      'Conversion Tracking',
    ],
  },
  'graphic-design': {
    accent: 'that elevates brand',
    ctaLabel: 'Design with us',
    highlights: [
      'Brand Identity',
      'Marketing Creatives',
      'Digital Assets',
      'Campaign Visuals',
    ],
  },
  'ui-ux-design': {
    accent: 'made for clarity',
    ctaLabel: 'Design product',
    highlights: [
      'User Research',
      'Interaction Design',
      'Design Systems',
      'Usability Testing',
    ],
  },
  'game-development': {
    accent: 'built for retention',
    ctaLabel: 'Build games',
    highlights: [
      'Game Development',
      '2D Game Development',
      'Mobile Game Development',
      '3D Game Development',
    ],
  },
  'saas-development': {
    accent: 'ready to subscribe',
    ctaLabel: 'Build SaaS',
    highlights: [
      'Multi-Tenant Platforms',
      'Billing & Access',
      'Admin Dashboards',
      'Secure Scale-Out',
    ],
  },
  'saas-development-service': {
    accent: 'ready to subscribe',
    ctaLabel: 'Build SaaS',
    highlights: [
      'Multi-Tenant Platforms',
      'Billing & Access',
      'Admin Dashboards',
      'Secure Scale-Out',
    ],
  },
  'saas-development-services': {
    accent: 'ready to subscribe',
    ctaLabel: 'Build SaaS',
    highlights: [
      'Multi-Tenant Platforms',
      'Billing & Access',
      'Admin Dashboards',
      'Secure Scale-Out',
    ],
  },
})

/**
 * @param {string} slug
 * @param {string} [title]
 * @returns {{ accent: string, ctaLabel: string, highlights: string[] }}
 */
export function resolveServiceShowcaseCopy(slug, title = '') {
  const key = String(slug ?? '').trim().toLowerCase()
  const titleLower = String(title ?? '').trim().toLowerCase()
  const isSaas = key.includes('saas') || titleLower.includes('saas development')
  const entry =
    SERVICE_SHOWCASE_COPY[key] ??
    (isSaas ? SERVICE_SHOWCASE_COPY['saas-development'] : null)

  if (entry) return entry

  return {
    accent: 'designed for impact',
    ctaLabel: 'Explore service',
    highlights: ['Strategy', 'Design', 'Engineering', 'Launch Support'],
  }
}
