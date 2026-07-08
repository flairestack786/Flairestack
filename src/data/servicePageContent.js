/** Cubix-style page content builder for service detail pages */

import { serviceTestimonials } from './serviceTestimonials'
import { getTechnologiesForService } from './serviceTechnologies'
import { getCapabilityDescription } from './serviceCapabilityDescriptions'

const INDUSTRY_DEFAULTS = [
  { title: 'Healthcare', description: 'HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery.' },
  { title: 'Fintech', description: 'Secure banking apps, payment gateways, digital wallets, and investment management platforms.' },
  { title: 'E-Commerce', description: 'Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking.' },
  { title: 'Education', description: 'E-learning platforms, LMS solutions, and interactive tutoring experiences.' },
  { title: 'Logistics', description: 'Fleet management, delivery tracking, and supply chain optimization tools.' },
  { title: 'Enterprise', description: 'Scalable B2B solutions with RBAC, analytics, security, and custom workflows.' },
  { title: 'SaaS', description: 'Multi-tenant platforms engineered for growth, retention, and subscription revenue.' },
  { title: 'Real Estate', description: 'Property listing apps, virtual tours, CRM integrations, and agent communication tools.' },
]

const POST_LAUNCH_DEFAULTS = [
  { title: 'Post-Launch Support', description: 'Immediate expert support after deployment to resolve issues and ensure operational stability from day one.' },
  { title: 'Optimization', description: 'Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations.' },
  { title: 'Engagement', description: 'Strategic feature updates and UX improvements that drive retention and keep users actively engaged.' },
  { title: 'Iteration', description: 'Data-informed releases that evolve with market trends and deliver lasting product value.' },
  { title: 'Security', description: 'Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection.' },
  { title: 'Performance', description: 'Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences.' },
]

/** Capability bento cards — distinct from framework (offerings) and growth (outcomes) sections */
function buildCapabilityHighlights(service, content) {
  const keyword = service.title.toLowerCase()
  const fromFeatures = (service.features ?? []).map((title) => ({
    title,
    description:
      content.capabilityDescriptions?.[title] ??
      getCapabilityDescription(service.slug, title, keyword),
  }))

  const differentiators = (content.differentiators ?? [
    {
      title: 'Security & Compliance',
      description: getCapabilityDescription(service.slug, 'Security & Compliance', keyword),
    },
    {
      title: 'Transparent Delivery',
      description: getCapabilityDescription(service.slug, 'Transparent Delivery', keyword),
    },
  ]).map((item) => ({
    ...item,
    description:
      content.capabilityDescriptions?.[item.title] ??
      getCapabilityDescription(service.slug, item.title, keyword),
  }))

  return [...fromFeatures, ...differentiators].slice(0, 6)
}

const CHALLENGES_BY_SLUG = {
  'database-development': {
    title: "Top Database Challenges We've Solved",
    intro: 'Data systems fail silently until scale hits — we design architectures that stay fast, consistent, and secure as volume and complexity grow.',
    items: [
      { title: 'Slow Queries at Scale', description: 'We optimize schemas, indexes, and query plans so dashboards and APIs stay responsive under heavy load.' },
      { title: 'Migration Risk', description: 'Zero-downtime migrations and replication strategies that move data safely without breaking production.' },
      { title: 'Fragmented Data Silos', description: 'Unified models and pipelines that give teams a single source of truth across applications and warehouses.' },
    ],
  },
  'software-quality-assurance': {
    title: "Top QA Challenges We've Solved",
    intro: 'Quality gaps surface late when testing is an afterthought — we embed QA across your SDLC so releases ship with confidence.',
    items: [
      { title: 'Regression Overload', description: 'Automated regression suites that catch breaking changes before they reach staging or production.' },
      { title: 'Flaky Releases', description: 'Structured test environments, CI gates, and release checklists that eliminate surprise production defects.' },
      { title: 'Performance Blind Spots', description: 'Load, stress, and soak testing that validates behavior under real-world traffic patterns.' },
    ],
  },
  'cloud-strategy': {
    title: "Top Cloud Challenges We've Solved",
    intro: 'Cloud adoption without strategy leads to cost sprawl and fragile systems — we align architecture, security, and FinOps from day one.',
    items: [
      { title: 'Runaway Cloud Costs', description: 'Rightsizing, reserved capacity, and FinOps practices that cut waste without sacrificing performance.' },
      { title: 'Legacy Migration Risk', description: 'Phased migration paths that modernize workloads with minimal downtime and clear rollback options.' },
      { title: 'Multi-Cloud Complexity', description: 'Consistent deployment patterns and observability across AWS, Azure, and GCP environments.' },
    ],
  },
  'ai-development': {
    title: "Top AI Implementation Challenges We've Solved",
    intro: "AI pilots stall when models, data, and production systems aren't integrated — we ship governed, observable AI that delivers business value.",
    items: [
      { title: 'Prototype-to-Production Gap', description: 'MLOps pipelines, eval harnesses, and deployment patterns that move models from demo to production safely.' },
      { title: 'Hallucination & Trust', description: 'RAG, guardrails, and human-in-the-loop workflows that keep outputs accurate and auditable.' },
      { title: 'Data Readiness', description: 'Vector stores, embedding pipelines, and data governance so models learn from clean, permissioned sources.' },
    ],
  },
  'digital-marketing': {
    title: "Top Digital Marketing Challenges We've Solved",
    intro: "Campaigns underperform when strategy, creative, and analytics aren't aligned — we build growth engines tied to measurable revenue outcomes.",
    items: [
      { title: 'Low Organic Visibility', description: 'Technical SEO, content architecture, and authority-building strategies that compound over time.' },
      { title: 'Wasted Ad Spend', description: 'Audience targeting, landing-page optimization, and attribution models that improve ROAS.' },
      { title: 'Siloed Analytics', description: 'Unified dashboards connecting product, marketing, and sales funnels for clearer decision-making.' },
    ],
  },
  'graphic-design': {
    title: "Top Brand Design Challenges We've Solved",
    intro: 'Inconsistent visuals erode trust — we create cohesive brand systems that scale across every channel and touchpoint.',
    items: [
      { title: 'Fragmented Brand Identity', description: 'Logo systems, typography, and color standards documented for teams and partners to follow.' },
      { title: 'Campaign Turnaround Pressure', description: 'Template libraries and production workflows that deliver premium assets on tight deadlines.' },
      { title: 'Off-Brand Collateral', description: 'Guidelines and review processes that keep marketing, product, and sales materials aligned.' },
    ],
  },
}

const PROCESS_CUBIX = [
  { step: '01', title: 'Discovery', text: 'We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins.' },
  { step: '02', title: 'Strategy', text: 'Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint.' },
  { step: '03', title: 'Design', text: 'Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences.' },
  { step: '04', title: 'Development', text: 'Senior engineers ship production-grade features using modern, secure, and scalable technology stacks.' },
  { step: '05', title: 'Testing', text: 'Automated and manual QA across environments ensures performance, security, and reliability before launch.' },
  { step: '06', title: 'Launch & Scale', text: 'We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch.' },
]

const slugOverrides = {
  'web-development': {
    framework: {
      title: 'Our Core Web Development Framework',
      intro: 'From frontend interfaces to backend APIs and cloud delivery — we engineer every layer of modern web applications with performance, security, and scalability at the center.',
      items: [
        { title: 'Custom Web Platforms', description: 'Tailored portals, dashboards, and customer-facing applications engineered for your business logic, brand identity, and conversion goals.' },
        { title: 'Frontend & Responsive UI', description: 'Pixel-perfect React and Next.js interfaces with responsive layouts, component libraries, and accessibility built into every screen.' },
        { title: 'SEO & Semantic Architecture', description: 'Semantic HTML, structured data, Core Web Vitals optimization, and search-ready architecture from the first sprint.' },
        { title: 'Backend APIs & Integrations', description: 'RESTful and GraphQL APIs, authentication layers, and third-party integrations connecting your web platform to the enterprise stack.' },
        { title: 'Cloud Deployment & DevOps', description: 'Edge delivery, CI/CD pipelines, monitoring, and scalable cloud infrastructure for reliable production releases.' },
      ],
    },
  },
  'mobile-app-development': {
    heroHeadline: 'Custom Mobile App Development Company',
    heroSubheadline: 'For over a decade, we\'ve delivered innovative, high-impact mobile applications that drive growth and create lasting value for enterprise businesses worldwide.',
    challenges: {
      title: 'Top Challenges We\'ve Solved',
      intro: 'Mobile app growth comes with unique challenges — and we\'re built to solve them. From streamlining user experiences to optimizing performance and scalability, we tackle the complexities holding your app back.',
      items: [
        { title: 'Low User Engagement', description: 'We\'ve reversed user decline by building high-performing apps that re-engage existing users and attract new audiences, driving sustainable growth.' },
        { title: 'Slow Market Entry', description: 'We help clients launch scalable MVPs rapidly, enabling market entry and regional expansion without costly restructuring or rebuilds.' },
        { title: 'Poor User Experience', description: 'We eliminate friction by transforming poor experiences into intuitive journeys that increase engagement and foster long-term loyalty.' },
      ],
    },
    framework: {
      title: 'Our Core Mobile App Development Framework',
      intro: 'We deliver tailored mobile solutions across native, cross-platform, hybrid, and progressive web technologies — ensuring the perfect fit for your business goals.',
      items: [
        { title: 'Native Android Development', description: 'We leverage Kotlin and Java to build high-performance Android apps with Material Design, Android APIs, and seamless device integration for robust performance and user satisfaction.' },
        { title: 'Native iOS Development', description: 'Using Swift and modern iOS frameworks like SwiftUI, we develop premium applications with exceptional performance, intuitive design, and deep Apple ecosystem integration.' },
        { title: 'Cross-Platform Development', description: 'We build once and deploy across iOS and Android using React Native and Flutter — delivering code reusability, faster time-to-market, and simplified maintenance.' },
        { title: 'Hybrid App Development', description: 'Our hybrid approach combines web and native technologies for cost-effective development with access to native device features, broad compatibility, and rapid deployment.' },
        { title: 'Progressive Web Apps', description: 'We create PWAs with offline functionality, fast loading, and app-like experiences through browsers — no app store download required.' },
      ],
    },
    growth: {
      title: 'How Our Mobile App Development Drives Growth',
      intro: 'Unlock the transformative power of custom mobile apps to forge deeper customer connections, streamline operations, and accelerate business growth.',
      items: [
        { title: 'Strengthen Brand Identity', description: 'Deliver a premium app experience that builds trust, credibility, and recognition — turning your product into a powerful brand asset.' },
        { title: '24/7 Customer Support', description: 'Intelligent in-app support that handles inquiries instantly and captures opportunities around the clock.' },
        { title: 'Data-Driven Insights', description: 'Turn user behavior into actionable intelligence with analytics on preferences, usage patterns, and conversion paths.' },
        { title: 'Boost Revenue & Sales', description: 'Increase earnings through subscriptions, in-app purchases, premium features, and targeted monetization strategies.' },
        { title: 'Deeper Customer Relationships', description: 'Create intimate connections through personalized experiences, real-time interactions, and dedicated user support.' },
        { title: 'Streamline Operations', description: 'Automate processes, improve efficiency, and reduce manual workload with custom app functionality across teams.' },
      ],
    },
    industries: {
      title: 'Specialized Mobile Solutions for Every Industry',
      intro: 'We build industry-specific apps that solve real-world problems with domain expertise baked into every sprint.',
    },
  },
}

export function buildServicePageContent(service, content, visuals) {
  const override = slugOverrides[service.slug] ?? {}
  const keyword = service.title.toLowerCase()
  const frameworkImages = visuals.framework ?? [
    visuals.overview,
    visuals.banner,
    visuals.features,
    visuals.tech,
    visuals.process,
  ]

  const frameworkItems = override.framework?.items ?? content.detailedBreakdown.map((item, i) => ({
    title: item.title,
    description: item.description,
    image: frameworkImages[i] ?? visuals.overview,
  }))

  const growthItems = override.growth?.items ?? content.benefitsDetail

  const capabilityItems = buildCapabilityHighlights(service, content)

  return {
    heroHeadline: override.heroHeadline ?? `Custom ${service.title} Company`,
    heroSubheadline: override.heroSubheadline ?? service.description,
    heroCta: 'Start Your Project',
    heroSecondaryCta: 'View Our Process',
    heroImage: visuals.hero,
    heroImages: [visuals.hero, visuals.overview, visuals.banner].filter((img) => img?.src),
    anchorNav: [
      { id: 'challenges', label: 'Challenges' },
      { id: 'framework', label: 'Services' },
      { id: 'features', label: 'Capabilities' },
      { id: 'growth', label: 'Benefits' },
      { id: 'process', label: 'Process' },
      { id: 'tech', label: 'Tech Stack' },
      { id: 'faq', label: 'FAQ' },
    ],
    features: {
      title: `Specialized ${service.title} Capabilities`,
      intro: `Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.`,
      items: capabilityItems,
    },
    challenges:
      override.challenges ??
      CHALLENGES_BY_SLUG[service.slug] ?? {
        title: `Top ${service.title} Challenges We Have Solved`,
        intro: `${service.title} comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.`,
        items: [
          { title: 'Technical Debt & Scale', description: 'We modernize legacy systems and architect scalable foundations that support growth without costly rewrites.' },
          { title: 'Slow Delivery Cycles', description: 'Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint.' },
          { title: 'Poor User Adoption', description: 'We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention.' },
        ],
      },
    framework: {
      title: override.framework?.title ?? `Our Core ${service.title} Framework`,
      intro: override.framework?.intro ?? `We deliver tailored ${keyword} solutions engineered for performance, security, and measurable business outcomes.`,
      items: frameworkItems.map((item, i) => ({
        ...item,
        image: item.image ?? frameworkImages[i] ?? frameworkImages[frameworkImages.length - 1],
      })),
    },
    growth: {
      title: override.growth?.title ?? `How Our ${service.title} Drives Growth`,
      intro: override.growth?.intro ?? `Unlock the transformative power of professional ${keyword} to accelerate revenue, streamline operations, and deepen customer relationships.`,
      items: growthItems,
    },
    testimonials: serviceTestimonials,
    testimonialsBackground: visuals.testimonialsBackground ?? null,
    process: {
      title: `Our Structured ${service.title} Approach`,
      intro: 'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
      steps: PROCESS_CUBIX,
      image: visuals.process,
    },
    industries: {
      title: override.industries?.title ?? `Specialized ${service.title} for Every Industry`,
      intro: override.industries?.intro ?? 'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
      items: INDUSTRY_DEFAULTS,
    },
    tech: {
      title: 'Technologies We Work With',
      intro: 'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
      items: getTechnologiesForService(service.slug, service.technologies),
    },
    postLaunch: {
      title: 'Post-Launch Services You Can Count On',
      intro: 'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
      items: POST_LAUNCH_DEFAULTS,
    },
    faqs: service.faqs,
    finalCta: {
      title: `Top-Rated ${service.title} Company`,
      subtitle: 'If you can\'t find what you\'re looking for, reach out — we\'ll respond promptly to assist you.',
      button: 'Send Message',
      background: visuals.finalCtaBackground ?? null,
    },
  }
}
