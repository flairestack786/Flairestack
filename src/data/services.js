import { buildVisualsForService } from './serviceVisuals'
import { buildServicePageContent } from './servicePageContent'
import { companyStats } from './companyStats'

const IMG = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

const defaultProcess = [
  { step: '01', title: 'Discovery', text: 'We align on goals, constraints, and success metrics with your stakeholders.' },
  { step: '02', title: 'Architecture', text: 'We design scalable systems, UX flows, and delivery roadmaps.' },
  { step: '03', title: 'Build & Iterate', text: 'Agile sprints with transparent reporting and continuous refinement.' },
  { step: '04', title: 'Launch & Scale', text: 'Production deployment, monitoring, and long-term optimization.' },
]

const defaultFaqs = (title) => [
  {
    q: `How long does a typical ${title.toLowerCase()} engagement take?`,
    a: 'Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs.',
  },
  {
    q: 'Do you work with existing in-house teams?',
    a: 'Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows.',
  },
  {
    q: 'What industries do you serve?',
    a: 'We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East.',
  },
  {
    q: 'How do you ensure quality and security?',
    a: 'Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures.',
  },
]

const contentBySlug = {
  'web-development': {
    seoTitle: 'Enterprise Web Development Services | FlaireStack',
    seoDescription: 'Professional web development for high-performance, SEO-optimized enterprise applications. Custom platforms built with React, Next.js, and modern edge delivery.',
    overview: [
      'Professional web development is the foundation of every modern digital business. At FlaireStack, we engineer high-performance web applications that load fast, rank well, and convert visitors into customers — without compromising on security or scalability.',
      'Our enterprise web development team combines frontend excellence, backend architecture, and DevOps automation to deliver platforms that support millions of users. From marketing sites to complex SaaS dashboards, we build with accessibility, SEO, and long-term maintainability at the core.',
      'Whether you need a greenfield product or a legacy migration, our web development services help organizations launch faster, reduce technical debt, and create digital experiences that reflect premium brand standards.',
    ],
    detailedBreakdown: [
      { title: 'Custom Web Platforms', description: 'Tailored portals, dashboards, and customer-facing applications engineered for your business logic and brand identity.' },
      { title: 'Performance & Core Web Vitals', description: 'Sub-second load times, optimized assets, edge caching, and Lighthouse-driven performance tuning.' },
      { title: 'SEO & Accessibility', description: 'Semantic HTML, structured data, WCAG compliance, and search-optimized architecture from day one.' },
      { title: 'Design System Integration', description: 'Pixel-perfect implementation of design systems with reusable components and consistent UX patterns.' },
    ],
    benefitsDetail: [
      { title: 'Faster Time-to-Market', description: 'Agile delivery with reusable architecture patterns accelerates launch without cutting corners.' },
      { title: 'Enterprise Security', description: 'Authentication, authorization, and data protection built to industry compliance standards.' },
      { title: 'Scalable Architecture', description: 'Systems designed to grow from MVP to millions of concurrent users without rewrites.' },
      { title: 'Measurable ROI', description: 'Analytics integration and conversion optimization tied directly to business KPIs.' },
    ],
    gallery: [],
    relatedServices: ['software-development', 'ui-ux-design', 'cloud-strategy'],
  },
  'database-development': {
    differentiators: [
      { title: 'Data Integrity & Governance', description: 'Schema design, access controls, and audit trails that keep mission-critical data accurate and compliant.' },
      { title: 'Query Performance at Scale', description: 'Indexing, partitioning, and tuning strategies that keep analytics and APIs fast as data volume grows.' },
    ],
  },
  'software-quality-assurance': {
    differentiators: [
      { title: 'Shift-Left Testing', description: 'QA embedded from requirements through release — catching defects early when they are cheapest to fix.' },
      { title: 'Release Confidence', description: 'Automated gates, regression suites, and sign-off checklists that make every deployment predictable.' },
    ],
  },
  'ai-development': {
    differentiators: [
      { title: 'Production AI Governance', description: 'Evals, guardrails, and observability so models stay accurate, safe, and accountable in production.' },
      { title: 'RAG & Knowledge Systems', description: 'Grounded answers from your data with vector pipelines tuned for relevance and permission boundaries.' },
    ],
  },
  'software-development': {
    seoTitle: 'Enterprise Software Development Solutions | FlaireStack',
    seoDescription: 'Custom enterprise software development for complex business systems. Scalable architecture, clean code, and DevOps excellence from senior engineers.',
    overview: [
      'Enterprise software development demands more than writing code — it requires deep understanding of business processes, regulatory constraints, and long-term system evolution. FlaireStack delivers custom software solutions engineered for reliability, maintainability, and scale.',
      'Our software development team works across the full stack: backend services, APIs, microservices, integrations, and cloud-native deployment. We partner with CTOs and product leaders to transform requirements into production-grade systems that support mission-critical operations.',
      'From monolith modernization to greenfield platform builds, our enterprise software development services reduce operational risk, accelerate delivery, and create technology assets that compound in value over time.',
    ],
    detailedBreakdown: [
      { title: 'Custom Application Development', description: 'Bespoke software tailored to complex workflows, industry regulations, and organizational structures.' },
      { title: 'API & Integration Layer', description: 'RESTful and GraphQL APIs connecting CRMs, ERPs, payment systems, and third-party services.' },
      { title: 'Legacy Modernization', description: 'Incremental migration from monoliths to microservices without disrupting live operations.' },
      { title: 'DevOps & CI/CD', description: 'Automated pipelines, infrastructure as code, and observability for reliable releases.' },
    ],
    benefitsDetail: [
      { title: 'Reduced Technical Debt', description: 'Clean architecture and automated testing prevent costly rewrites down the line.' },
      { title: 'Operational Efficiency', description: 'Streamlined workflows and intelligent automation reduce manual overhead.' },
      { title: 'Future-Proof Systems', description: 'Modular design enables feature expansion without architectural bottlenecks.' },
      { title: 'Dedicated Senior Team', description: 'Experienced engineers embedded in your workflow with transparent communication.' },
    ],
    // Visuals for this page are sourced from /public/images/services/software-development/
    gallery: [],
    relatedServices: ['software-quality-assurance', 'cloud-strategy', 'database-development'],
  },
  'mobile-app-development': {
    seoTitle: 'Mobile App Development Services | iOS & Android | FlaireStack',
    seoDescription: 'Premium mobile app development for iOS and Android. Native and cross-platform apps with scalable architecture, premium UX, and App Store excellence.',
    overview: [
      'Mobile app development is how modern businesses reach customers where they spend the most time — on their phones. FlaireStack builds native and cross-platform mobile applications with premium UX, offline resilience, and the performance users expect from top-tier apps.',
      'Our mobile development process spans discovery, prototyping, engineering, QA, and App Store deployment. We focus on mobile app scalability — ensuring your architecture supports feature growth, user expansion, and platform updates without friction.',
      'From consumer-facing apps to enterprise field tools, our mobile app development services combine design precision with engineering rigor to deliver products that earn high ratings and drive measurable engagement.',
    ],
    detailedBreakdown: [
      { title: 'iOS & Android Native Apps', description: 'Platform-optimized experiences leveraging Swift, Kotlin, and native SDK capabilities.' },
      { title: 'Cross-Platform Development', description: 'React Native and Flutter builds for faster multi-platform delivery with shared codebase.' },
      { title: 'Mobile UX & Prototyping', description: 'Interactive prototypes, usability testing, and design systems tailored for touch interfaces.' },
      { title: 'Backend & Push Infrastructure', description: 'Scalable APIs, real-time sync, push notifications, and analytics integration.' },
    ],
    benefitsDetail: [
      { title: 'Premium User Experience', description: 'Intuitive navigation, smooth animations, and accessibility built into every screen.' },
      { title: 'Offline-First Architecture', description: 'Reliable performance even with intermittent connectivity.' },
      { title: 'App Store Optimization', description: 'Launch strategy, metadata, and compliance for iOS App Store and Google Play.' },
      { title: 'Scalable Mobile Backend', description: 'Cloud infrastructure that grows with your user base and feature set.' },
    ],
    gallery: [
      { src: IMG('photo-1555774698-01b2078775d7'), alt: 'Premium smartphone displaying modern mobile app interface mockups' },
      { src: IMG('photo-1617877014143-2356872d7a83'), alt: 'Mobile app prototyping and UI design workflow on desk' },
      { src: IMG('photo-1551650975-87deedd944c8'), alt: 'Clean futuristic mobile app screens on smartphone device' },
    ],
    relatedServices: ['ui-ux-design', 'software-development', 'cloud-strategy'],
  },
  'digital-marketing': {
    seoTitle: 'Enterprise Digital Marketing Services | SEO & Growth | FlaireStack',
    seoDescription: 'Data-driven digital marketing with SEO, paid media, analytics, and growth strategy. Premium campaigns engineered for measurable ROI and brand authority.',
    overview: [
      'Digital marketing in the enterprise requires precision — not generic campaigns or vanity metrics. FlaireStack delivers data-driven marketing strategies that connect SEO, content, paid media, and analytics into a unified growth engine aligned with your revenue goals.',
      'Our digital marketing team builds sustainable acquisition channels: search engine optimization, conversion rate optimization, social campaign management, and marketing automation. Every initiative is measured against KPIs that matter to leadership.',
      'We avoid cheesy stock approaches. Instead, we engineer premium growth programs with enterprise-grade reporting, A/B testing frameworks, and strategic content that positions your brand as an industry authority.',
    ],
    detailedBreakdown: [
      { title: 'Search Engine Optimization', description: 'Technical SEO, content strategy, and authority building for sustainable organic growth.' },
      { title: 'Paid Media & Campaign Management', description: 'Google Ads, Meta Ads, and LinkedIn campaigns optimized for cost-per-acquisition.' },
      { title: 'Analytics & Attribution', description: 'Full-funnel tracking, dashboard reporting, and data-driven budget allocation.' },
      { title: 'Content & Brand Strategy', description: 'Editorial calendars, thought leadership, and conversion-focused landing pages.' },
    ],
    benefitsDetail: [
      { title: 'Measurable ROI', description: 'Every campaign tied to revenue, leads, and lifetime value — not impressions alone.' },
      { title: 'Enterprise Reporting', description: 'Executive dashboards with real-time performance visibility.' },
      { title: 'Integrated Funnel Strategy', description: 'Marketing aligned with product, sales, and customer success workflows.' },
      { title: 'Sustainable Growth', description: 'Long-term SEO and content assets that compound over time.' },
    ],
    gallery: [
      { src: IMG('photo-1556760544-74068522e931'), alt: 'Digital marketing team analyzing growth analytics dashboard' },
      { src: IMG('photo-1551288049-bebda4e38f71'), alt: 'Premium business analytics dashboard with SEO and growth metrics' },
      { src: IMG('photo-1460925895917-afdab827c52f'), alt: 'Marketing strategy session with data visualization on laptop' },
    ],
    relatedServices: ['data-analytics', 'web-development', 'graphic-design'],
  },
  'game-development': {
    seoTitle: 'Game Development Services | Unity & Unreal Engine | FlaireStack',
    seoDescription: 'Professional game development with Unity and Unreal Engine. Cinematic visuals, multiplayer architecture, and scalable backend infrastructure.',
    overview: [
      'Game development is where engineering meets artistry — and where technical excellence determines whether players stay or leave. FlaireStack builds immersive game experiences with modern engines, optimized performance, and scalable multiplayer infrastructure.',
      'Our game development team works across mobile, PC, and console platforms using Unity and Unreal Engine. From environment creation and 3D rendering to gameplay systems and live ops, we deliver cinematic-quality experiences in dark, immersive creative atmospheres.',
      'Whether you are prototyping a new IP or scaling a live title, our game development services combine creative vision with enterprise-grade engineering — ensuring your game performs flawlessly at launch and beyond.',
    ],
    detailedBreakdown: [
      { title: 'Unity & Unreal Engine Development', description: 'Full-cycle game builds using industry-standard engines and modern rendering pipelines.' },
      { title: '3D Environment & Asset Creation', description: 'Level design, character modeling, and cinematic environment art direction.' },
      { title: 'Multiplayer & Backend Systems', description: 'Netcode, matchmaking, leaderboards, and cloud-hosted game server architecture.' },
      { title: 'Performance Optimization', description: 'Frame rate tuning, asset streaming, and platform-specific optimization.' },
    ],
    benefitsDetail: [
      { title: 'Cinematic Visual Quality', description: 'Lighting, shaders, and art direction that rival AAA production values.' },
      { title: 'Cross-Platform Reach', description: 'Deploy to mobile, PC, and console from unified engine workflows.' },
      { title: 'Scalable Live Ops', description: 'Backend systems supporting updates, events, and monetization at scale.' },
      { title: 'Experienced Dev Team', description: 'Engineers and artists who understand both creative vision and technical constraints.' },
    ],
    gallery: [
      { src: IMG('photo-1540575467063-178a50c2df87'), alt: 'Immersive game development workspace with cinematic dark atmosphere' },
      { src: IMG('photo-1493711669012-77ba3f778830'), alt: 'Game developers working on modern engine project with multiple displays' },
      { src: IMG('photo-1511512578047-dfb367046420'), alt: 'Creative game studio environment with immersive gaming setup' },
    ],
    relatedServices: ['software-development', 'ui-ux-design', 'cloud-strategy'],
  },
  'cloud-strategy': {
    seoTitle: 'Enterprise Cloud Strategy Services | AWS, Azure, GCP | FlaireStack',
    seoDescription: 'Professional cloud strategy consulting for migration, multi-cloud architecture, Kubernetes, and FinOps. Reduce cost and accelerate innovation.',
    overview: [
      'Cloud strategy is how modern enterprises achieve agility without sacrificing security or cost control. FlaireStack helps organizations adopt cloud with confidence — from initial assessment through migration, optimization, and ongoing governance.',
      'The advantages of cloud strategy include faster deployment cycles, elastic scaling, and reduced infrastructure overhead. Our consultants design multi-cloud and hybrid architectures tailored to compliance requirements, workload patterns, and budget constraints.',
      'Whether you are lifting-and-shifting legacy systems or building cloud-native from day one, our cloud strategy services deliver measurable ROI through FinOps, automation, and enterprise-grade observability.',
    ],
    gallery: [
      { src: IMG('photo-1451187580459-43490279c0fa'), alt: 'Cloud infrastructure and global network strategy visualization' },
      { src: IMG('photo-1558494949-ef010cbdcc31'), alt: 'Enterprise server room with cloud architecture planning' },
      { src: IMG('photo-1551288049-bebda4e38f71'), alt: 'Cloud cost and performance analytics dashboard' },
    ],
    relatedServices: ['software-development', 'database-development', 'it-consultancy'],
  },
  'ai-development': {
    seoTitle: 'AI Development Services | Enterprise LLM & ML Solutions | FlaireStack',
    seoDescription: 'Production-ready AI development services including LLM integration, RAG systems, agents, and MLOps. Why businesses need AI solutions built for enterprise scale.',
    overview: [
      'Why businesses need AI solutions is no longer theoretical — it is operational. Organizations that deploy intelligent systems gain faster decision-making, automated workflows, and differentiated customer experiences. FlaireStack engineers production-ready AI that delivers ROI, not demos.',
      'Our artificial intelligence development services span LLM integration, retrieval-augmented generation, agent orchestration, computer vision, and custom ML pipelines — all deployed with security, observability, and human-in-the-loop safeguards.',
      'From copilots to predictive analytics, we help enterprises adopt AI responsibly — with governance frameworks, evaluation pipelines, and infrastructure designed for scale.',
    ],
    gallery: [
      { src: IMG('photo-1677442136019-21780ecad995'), alt: 'AI neural network and machine learning dashboard visualization' },
      { src: IMG('photo-1555255707-c07966088b7b'), alt: 'Enterprise AI development team analyzing model performance' },
      { src: IMG('photo-1620712943543-bcc4688e7485'), alt: 'Artificial intelligence system architecture on displays' },
    ],
    relatedServices: ['data-analytics', 'software-development', 'cloud-strategy'],
  },
  'ui-ux-design': {
    seoTitle: 'UI/UX Design Services | Enterprise Design Systems | FlaireStack',
    seoDescription: 'Professional UI/UX design services for SaaS and enterprise products. Research, prototyping, design systems, and usability testing that drives conversion.',
    overview: [
      'The importance of UI/UX design cannot be overstated in enterprise software — it directly impacts adoption, retention, and revenue. FlaireStack delivers human-centered design that balances aesthetic excellence with measurable usability outcomes.',
      'Our UI/UX design services include user research, information architecture, wireframing, high-fidelity prototyping, design system creation, and usability testing — ensuring every interaction reflects your brand and serves user goals.',
      'We partner with product and engineering teams to create interfaces that reduce friction, improve accessibility, and convert — from marketing sites to complex B2B dashboards.',
    ],
    gallery: [
      { src: IMG('photo-1586717791821-3f44a563fa4c'), alt: 'UI UX wireframes and design system on creative desk' },
      { src: IMG('photo-1561070791-2526d30994b5'), alt: 'Design team collaborating on interface prototypes' },
      { src: IMG('photo-1617877014143-2356872d7a83'), alt: 'Mobile and web interface design workflow' },
    ],
    relatedServices: ['web-development', 'mobile-app-development', 'graphic-design'],
  },
}

function defaultContent(title, slug) {
  const keyword = title.toLowerCase()
  return {
    seoTitle: `${title} Services | Enterprise Solutions | FlaireStack`,
    seoDescription: `Professional ${keyword} services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.`,
    overview: [
      `${title} is a critical capability for organizations competing in today's digital landscape. FlaireStack delivers enterprise-grade ${keyword} solutions designed for performance, security, and long-term scalability.`,
      `Our team combines deep technical expertise with strategic consulting to ensure every ${keyword} engagement drives measurable business value — from initial discovery through production launch and ongoing optimization.`,
      `Partner with FlaireStack for ${keyword} services that reflect the quality standards of leading SaaS companies, fintech platforms, and AI-native startups worldwide.`,
    ],
    detailedBreakdown: [
      { title: 'Strategy & Discovery', description: `Comprehensive assessment of your ${keyword} requirements, constraints, and success metrics.` },
      { title: 'Architecture & Design', description: 'Scalable system design with enterprise security and performance benchmarks.' },
      { title: 'Implementation & Testing', description: 'Agile delivery with automated quality assurance and transparent progress reporting.' },
      { title: 'Launch & Optimization', description: 'Production deployment, monitoring, and continuous improvement cycles.' },
    ],
    benefitsDetail: [
      { title: 'Enterprise Quality', description: 'Production-grade deliverables with documentation and knowledge transfer.' },
      { title: 'Senior Expertise', description: 'Dedicated team of experienced specialists embedded in your workflow.' },
      { title: 'Scalable Solutions', description: 'Architecture designed to grow with your organization and user base.' },
      { title: 'Measurable Outcomes', description: 'KPI-driven delivery with clear ROI tracking and executive reporting.' },
    ],
    differentiators: [
      { title: 'Security & Compliance', description: `Enterprise-grade security practices tailored to ${keyword} workloads and regulatory requirements.` },
      { title: 'Transparent Delivery', description: 'Weekly demos, sprint reporting, and direct access to senior specialists throughout the engagement.' },
    ],
    gallery: [],
    relatedServices: ['software-development', 'cloud-strategy', 'it-consultancy'].filter((s) => s !== slug).slice(0, 3),
  }
}

function buildService(config) {
  const content = { ...defaultContent(config.title, config.slug), ...contentBySlug[config.slug] }
  const visuals = buildVisualsForService(config.slug, config.title)

  const built = {
    features: [
      'Enterprise-grade architecture and security',
      'Performance optimization at scale',
      'Dedicated senior engineering team',
      'Transparent agile delivery',
    ],
    technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
    process: defaultProcess,
    benefits: content.benefitsDetail.map((b) => b.title),
    stats: config.stats ?? companyStats,
    faqs: defaultFaqs(config.title),
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    overview: content.overview,
    detailedBreakdown: content.detailedBreakdown,
    benefitsDetail: content.benefitsDetail,
    visuals,
    image: visuals.hero.src,
    relatedServices: content.relatedServices,
    ...config,
    image: visuals.hero.src,
  }

  built.page = buildServicePageContent(built, content, visuals)
  built.process = built.page.process.steps

  return built
}

export const services = [
  buildService({
    slug: 'web-development',
    title: 'Web Development',
    shortDescription: 'High-performance web applications engineered for scale, speed, and conversion.',
    description: 'We craft cinematic, conversion-focused web experiences using modern frameworks, edge delivery, and rigorous engineering standards — built to perform at enterprise scale.',
    icon: 'Globe',
    technologies: ['React', 'Next.js', 'TypeScript', 'Vite', 'Tailwind CSS', 'Vercel'],
    features: ['Custom web platforms & portals', 'SSR/SSG & edge rendering', 'Accessibility & SEO excellence', 'Design system integration'],
  }),
  buildService({
    slug: 'software-development',
    title: 'Software Development',
    shortDescription: 'End-to-end custom software built for complex business logic and long-term growth.',
    description: 'From greenfield products to legacy modernization, we deliver robust software systems with clean architecture, automated testing, and DevOps excellence.',
    icon: 'Code2',
    technologies: ['Python', 'Java', 'C#', '.NET', 'Go', 'Kubernetes'],
  }),
  buildService({
    slug: 'domain-hosting',
    title: 'Domain Hosting',
    shortDescription: 'Secure, high-availability hosting infrastructure with global edge performance.',
    description: 'We architect and manage hosting environments — from domain strategy to CDN, SSL, and 24/7 monitoring — ensuring your digital presence stays fast and resilient.',
    image: IMG('photo-1558494949-ef010cbdcc31'),
    icon: 'Server',
    technologies: ['AWS', 'Cloudflare', 'DNS', 'NGINX', 'Terraform', "Let's Encrypt"],
    features: ['Domain & DNS management', 'SSL/TLS & security hardening', 'CDN & edge caching', 'Uptime monitoring & alerts'],
  }),
  buildService({
    slug: 'software-quality-assurance',
    title: 'Software Quality Assurance',
    shortDescription: 'Comprehensive QA strategies that protect quality from code to production.',
    description: 'Our QA engineers embed quality throughout your SDLC — automated testing, performance benchmarks, and release validation for zero-surprise deployments.',
    image: IMG('photo-1516321318423-f06f85e504b3'),
    icon: 'ShieldCheck',
    technologies: ['Playwright', 'Cypress', 'Jest', 'Selenium', 'k6', 'Postman'],
    features: ['Automated test suites', 'Performance & load testing', 'Regression & smoke testing', 'CI/CD quality gates'],
  }),
  buildService({
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    shortDescription: 'Native and cross-platform mobile apps with premium UX and offline resilience.',
    description: 'We build mobile experiences that feel effortless — performant, intuitive, and engineered for App Store excellence across iOS and Android.',
    icon: 'Smartphone',
    technologies: ['React Native', 'Swift', 'Kotlin', 'Flutter', 'Firebase', 'GraphQL'],
  }),
  buildService({
    slug: 'it-consultancy',
    title: 'IT Consultancy',
    shortDescription: 'Strategic technology advisory for digital transformation and operational excellence.',
    description: 'Our consultants partner with leadership teams to align technology investments with business outcomes — from roadmap planning to vendor selection and governance.',
    image: IMG('photo-1522071820081-009f0129c71c'),
    icon: 'Briefcase',
    technologies: ['Enterprise Architecture', 'ITIL', 'Agile', 'TOGAF', 'Cloud Strategy', 'Security'],
  }),
  buildService({
    slug: 'database-development',
    title: 'Database Development',
    shortDescription: 'Scalable data models, migrations, and performance tuning for mission-critical systems.',
    description: 'We design and optimize database architectures — relational, NoSQL, and data warehouses — built for integrity, speed, and enterprise compliance.',
    image: IMG('photo-1551288049-bebda4e38f71'),
    icon: 'Database',
    technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'Snowflake', 'Elasticsearch', 'Prisma'],
  }),
  buildService({
    slug: 'e-commerce-website-development',
    title: 'E-Commerce Website Development',
    shortDescription: 'Premium online stores engineered for conversion, inventory, and global scale.',
    description: 'We build headless and platform-native commerce experiences with seamless checkout, inventory sync, and analytics — designed to maximize revenue per visitor.',
    image: IMG('photo-1556742049-0cfed4f6a45d'),
    icon: 'ShoppingCart',
    technologies: ['Shopify', 'WooCommerce', 'Stripe', 'Medusa', 'Next.js', 'Sanity'],
  }),
  buildService({
    slug: 'cloud-strategy',
    title: 'Cloud Strategy',
    shortDescription: 'Cloud-native architecture, migration, and cost optimization for modern enterprises.',
    description: 'We help organizations adopt cloud with confidence — multi-cloud strategy, container orchestration, serverless, and FinOps for sustainable growth.',
    image: IMG('photo-1451187580459-43490279c0fa'),
    icon: 'Cloud',
    technologies: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform', 'Lambda'],
  }),
  buildService({
    slug: 'ai-development',
    title: 'Artificial Intelligence Development Services',
    shortDescription: 'Production-ready AI systems — from LLM integration to custom ML pipelines.',
    description: 'We engineer intelligent products with RAG, agents, computer vision, and predictive models — deployed securely with observability and human-in-the-loop safeguards.',
    image: IMG('photo-1677442136019-21780ecad995'),
    icon: 'Brain',
    technologies: ['OpenAI', 'PyTorch', 'LangChain', 'Python', 'Vector DBs', 'MLOps'],
    features: ['LLM & agent orchestration', 'RAG & knowledge systems', 'Model fine-tuning & eval', 'AI safety & governance'],
  }),
  buildService({
    slug: 'data-analytics',
    title: 'Data & Analytics',
    shortDescription: 'Turn raw data into actionable intelligence with modern analytics stacks.',
    description: 'We build dashboards, pipelines, and BI systems that empower leaders with real-time insights — from ETL to predictive analytics and executive reporting.',
    image: IMG('photo-1551288049-bebda4e38f71'),
    icon: 'BarChart3',
    technologies: ['dbt', 'Snowflake', 'BigQuery', 'Tableau', 'Power BI', 'Apache Spark'],
  }),
  buildService({
    slug: 'business-process-services',
    title: 'Business Process Services',
    shortDescription: 'Workflow automation and process optimization for operational efficiency.',
    description: 'We map, automate, and optimize business processes — reducing manual overhead with intelligent workflows, integrations, and measurable KPI improvements.',
    image: IMG('photo-1460925895917-afdab827c52f'),
    icon: 'Workflow',
    technologies: ['Zapier', 'Power Automate', 'Camunda', 'RPA', 'API Integrations', 'BPMN'],
  }),
  buildService({
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    shortDescription: 'Data-driven marketing strategies that amplify brand reach and ROI.',
    description: 'We combine SEO, paid media, content strategy, and analytics to build sustainable growth engines — aligned with your product and conversion funnels.',
    icon: 'TrendingUp',
    technologies: ['Google Analytics', 'HubSpot', 'SEMrush', 'Meta Ads', 'Google Ads', 'Hotjar'],
  }),
  buildService({
    slug: 'graphic-design',
    title: 'Graphic Design',
    shortDescription: 'Visual identity and creative assets that elevate your brand presence.',
    description: 'Our designers craft cohesive brand systems — logos, marketing collateral, and campaign visuals with cinematic polish and enterprise consistency.',
    image: IMG('photo-1561070791-2526d30994b5'),
    icon: 'Palette',
    technologies: ['Figma', 'Adobe Creative Suite', 'Illustrator', 'Photoshop', 'After Effects', 'InDesign'],
  }),
  buildService({
    slug: 'ui-ux-design',
    title: 'UI/UX Design Services',
    shortDescription: 'Human-centered design systems that balance beauty, usability, and conversion.',
    description: 'We design intuitive interfaces through research, wireframing, prototyping, and usability testing — creating experiences users love and businesses trust.',
    image: IMG('photo-1586717791821-3f44a563fa4c'),
    icon: 'Layout',
    technologies: ['Figma', 'Framer', 'Design Systems', 'User Research', 'Prototyping', 'A/B Testing'],
  }),
  buildService({
    slug: 'game-development',
    title: 'Game Development Services',
    shortDescription: 'Immersive game experiences built with modern engines and multiplayer architecture.',
    description: 'From mobile casual to AAA-style experiences, we develop games with stunning visuals, optimized performance, and scalable backend infrastructure.',
    icon: 'Gamepad2',
    technologies: ['Unity', 'Unreal Engine', 'C#', 'C++', 'Photon', 'Blender'],
  }),
]

export function getServiceBySlug(slug) {
  return services.find((s) => s.slug === slug)
}

export function getRelatedServices(slugs) {
  return slugs.map((s) => getServiceBySlug(s)).filter(Boolean)
}
