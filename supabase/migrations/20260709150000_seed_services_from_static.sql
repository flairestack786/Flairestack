-- =============================================================================
-- FlaireStack CMS — seed all services from src/data/services.js
-- Idempotent: ON CONFLICT / NOT EXISTS guards. Safe to re-run.
-- Seeds: services (published), service_sections, seo_metadata.
-- service_media is skipped: bundled WebP assets are not media_assets rows yet;
-- public pages continue using bundled fallbacks until Media Library images are assigned.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- web-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'web-development',
  'Web Development',
  'High-performance web applications engineered for scale, speed, and conversion.',
  'We craft cinematic, conversion-focused web experiences using modern frameworks, edge delivery, and rigorous engineering standards — built to perform at enterprise scale.',
  'Globe',
  0,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Web Development Company',
  'We craft cinematic, conversion-focused web experiences using modern frameworks, edge delivery, and rigorous engineering standards — built to perform at enterprise scale.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Web Development Challenges We Have Solved',
  'Web Development comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Web Development Framework',
  'From frontend interfaces to backend APIs and cloud delivery — we engineer every layer of modern web applications with performance, security, and scalability at the center.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Custom Web Platforms","description":"Tailored portals, dashboards, and customer-facing applications engineered for your business logic, brand identity, and conversion goals."},{"title":"Frontend & Responsive UI","description":"Pixel-perfect React and Next.js interfaces with responsive layouts, component libraries, and accessibility built into every screen."},{"title":"SEO & Semantic Architecture","description":"Semantic HTML, structured data, Core Web Vitals optimization, and search-ready architecture from the first sprint."},{"title":"Backend APIs & Integrations","description":"RESTful and GraphQL APIs, authentication layers, and third-party integrations connecting your web platform to the enterprise stack."},{"title":"Cloud Deployment & DevOps","description":"Edge delivery, CI/CD pipelines, monitoring, and scalable cloud infrastructure for reliable production releases."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Web Development Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Custom web platforms & portals","description":"We build member portals, partner dashboards, and customer apps around how your teams actually work—not one-size templates that slow every update."},{"title":"SSR/SSG & edge rendering","description":"Important pages are pre-rendered and served close to your visitors, so load times stay low, SEO stays strong, and campaigns do not stall on slow first paints."},{"title":"Accessibility & SEO excellence","description":"Semantic structure, keyboard-friendly flows, and crawlable content are part of the build, so you reach more users without paying for a retrofit after launch."},{"title":"Design system integration","description":"Your brand becomes a shared component library, so new pages ship faster and marketing, product, and sales stay visually aligned."},{"title":"Security & Compliance","description":"Login, permissions, and sensitive data handling are designed in early—aligned to your compliance needs rather than patched in after an audit."},{"title":"Transparent Delivery","description":"You get working demos each sprint, a clear view of what is next, and direct access to the engineers shipping your site."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Web Development Drives Growth',
  'Unlock the transformative power of professional web development to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Faster Time-to-Market","description":"Agile delivery with reusable architecture patterns accelerates launch without cutting corners."},{"title":"Enterprise Security","description":"Authentication, authorization, and data protection built to industry compliance standards."},{"title":"Scalable Architecture","description":"Systems designed to grow from MVP to millions of concurrent users without rewrites."},{"title":"Measurable ROI","description":"Analytics integration and conversion optimization tied directly to business KPIs."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Web Development Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Web Development for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"HTML5"},{"name":"CSS3"},{"name":"JavaScript"},{"name":"TypeScript"},{"name":"React"},{"name":"Next.js"},{"name":"Node.js"},{"name":"Express"},{"name":"Tailwind CSS"},{"name":"Vite"},{"name":"PHP"},{"name":"Laravel"},{"name":"GraphQL"},{"name":"PostgreSQL"},{"name":"Vercel"},{"name":"Figma"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our web development services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical web development engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Web Development Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Enterprise Web Development Services | FlaireStack',
  'Professional web development for high-performance, SEO-optimized enterprise applications. Custom platforms built with React, Next.js, and modern edge delivery.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- software-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'software-development',
  'Software Development',
  'End-to-end custom software built for complex business logic and long-term growth.',
  'From greenfield products to legacy modernization, we deliver robust software systems with clean architecture, automated testing, and DevOps excellence.',
  'Code2',
  1,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Software Development Company',
  'From greenfield products to legacy modernization, we deliver robust software systems with clean architecture, automated testing, and DevOps excellence.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Software Development Challenges We Have Solved',
  'Software Development comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Software Development Framework',
  'We deliver tailored software development solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Custom Application Development","description":"Bespoke software tailored to complex workflows, industry regulations, and organizational structures."},{"title":"API & Integration Layer","description":"RESTful and GraphQL APIs connecting CRMs, ERPs, payment systems, and third-party services."},{"title":"Legacy Modernization","description":"Incremental migration from monoliths to microservices without disrupting live operations."},{"title":"DevOps & CI/CD","description":"Automated pipelines, infrastructure as code, and observability for reliable releases."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Software Development Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"We structure applications so teams can add features without breaking core workflows, with security controls that match how your business actually operates."},{"title":"Performance optimization at scale","description":"Systems are load-tested and tuned before traffic spikes hit, so APIs and dashboards stay responsive when usage grows."},{"title":"Dedicated senior engineering team","description":"The people planning your architecture are the same people writing and reviewing production code—no handoff to a junior bench mid-project."},{"title":"Transparent agile delivery","description":"Fortnightly demos, honest scope conversations, and visible backlogs keep stakeholders aligned before deadlines become surprises."},{"title":"Security & Compliance","description":"Role-based access, encryption, and audit-friendly logging are treated as product requirements—not optional add-ons at the end."},{"title":"Transparent Delivery","description":"You always know what shipped, what is in progress, and what is blocked, with documentation your internal team can maintain after go-live."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Software Development Drives Growth',
  'Unlock the transformative power of professional software development to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Reduced Technical Debt","description":"Clean architecture and automated testing prevent costly rewrites down the line."},{"title":"Operational Efficiency","description":"Streamlined workflows and intelligent automation reduce manual overhead."},{"title":"Future-Proof Systems","description":"Modular design enables feature expansion without architectural bottlenecks."},{"title":"Dedicated Senior Team","description":"Experienced engineers embedded in your workflow with transparent communication."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Software Development Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Software Development for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Python"},{"name":"Java"},{"name":"C#"},{"name":".NET"},{"name":"Go"},{"name":"Rust"},{"name":"TypeScript"},{"name":"Node.js"},{"name":"React"},{"name":"Docker"},{"name":"Kubernetes"},{"name":"PostgreSQL"},{"name":"MongoDB"},{"name":"Redis"},{"name":"GraphQL"},{"name":"GitHub Actions"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our software development services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical software development engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Software Development Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Enterprise Software Development Solutions | FlaireStack',
  'Custom enterprise software development for complex business systems. Scalable architecture, clean code, and DevOps excellence from senior engineers.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'software-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- domain-hosting
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'domain-hosting',
  'Domain Hosting',
  'Secure, high-availability hosting infrastructure with global edge performance.',
  'We architect and manage hosting environments — from domain strategy to CDN, SSL, and 24/7 monitoring — ensuring your digital presence stays fast and resilient.',
  'Server',
  2,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Domain Hosting Company',
  'We architect and manage hosting environments — from domain strategy to CDN, SSL, and 24/7 monitoring — ensuring your digital presence stays fast and resilient.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Domain Hosting Challenges We Have Solved',
  'Domain Hosting comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Domain Hosting Framework',
  'We deliver tailored domain hosting solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your domain hosting requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Domain Hosting Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Domain & DNS management","description":"We register, configure, and maintain domains and DNS so email, subdomains, and staging environments stay reliable through launches and migrations."},{"title":"SSL/TLS & security hardening","description":"Certificates renew automatically, protocols stay current, and basic hardening reduces the risk of downtime from expired or misconfigured security settings."},{"title":"CDN & edge caching","description":"Static assets and key pages are cached globally so international visitors get fast responses without you managing servers in every region."},{"title":"Uptime monitoring & alerts","description":"We watch availability and performance around the clock and respond when something breaks—not when a customer tells you the site is down."},{"title":"Security & Compliance","description":"Hosting choices account for data residency, access controls, and backup expectations your industry or clients require."},{"title":"Transparent Delivery","description":"Migration plans, cutover windows, and rollback steps are documented before anything touches production traffic."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Domain Hosting Drives Growth',
  'Unlock the transformative power of professional domain hosting to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Domain Hosting Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Domain Hosting for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"AWS"},{"name":"Microsoft Azure"},{"name":"Google Cloud"},{"name":"Cloudflare"},{"name":"NGINX"},{"name":"Apache"},{"name":"Linux"},{"name":"Ubuntu"},{"name":"Docker"},{"name":"Kubernetes"},{"name":"Terraform"},{"name":"Let''s Encrypt"},{"name":"DigitalOcean"},{"name":"Vercel"},{"name":"GitHub"},{"name":"cPanel"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our domain hosting services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical domain hosting engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Domain Hosting Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Domain Hosting Services | Enterprise Solutions | FlaireStack',
  'Professional domain hosting services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'domain-hosting'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- software-quality-assurance
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'software-quality-assurance',
  'Software Quality Assurance',
  'Comprehensive QA strategies that protect quality from code to production.',
  'Our QA engineers embed quality throughout your SDLC — automated testing, performance benchmarks, and release validation for zero-surprise deployments.',
  'ShieldCheck',
  3,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Software Quality Assurance Company',
  'Our QA engineers embed quality throughout your SDLC — automated testing, performance benchmarks, and release validation for zero-surprise deployments.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top QA Challenges We''ve Solved',
  'Quality gaps surface late when testing is an afterthought — we embed QA across your SDLC so releases ship with confidence.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Regression Overload","description":"Automated regression suites that catch breaking changes before they reach staging or production."},{"title":"Flaky Releases","description":"Structured test environments, CI gates, and release checklists that eliminate surprise production defects."},{"title":"Performance Blind Spots","description":"Load, stress, and soak testing that validates behavior under real-world traffic patterns."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Software Quality Assurance Framework',
  'We deliver tailored software quality assurance solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your software quality assurance requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Software Quality Assurance Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Automated test suites","description":"Regression and API tests run on every build so teams catch breaking changes in minutes instead of discovering them in production."},{"title":"Performance & load testing","description":"We simulate real traffic patterns before go-live so checkout, login, and reporting flows do not fail under peak load."},{"title":"Regression & smoke testing","description":"Critical user paths are checked before each release, giving product owners confidence that yesterday’s fixes did not break today’s launch."},{"title":"CI/CD quality gates","description":"Failed tests block merges and deployments, so quality standards are enforced by the pipeline—not by last-minute manual checks."},{"title":"Shift-Left Testing","description":"QA joins requirements and design reviews early, when fixing a misunderstanding costs hours instead of weeks."},{"title":"Release Confidence","description":"Sign-off checklists, environment parity, and clear exit criteria mean releases happen on schedule without heroics the night before."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Software Quality Assurance Drives Growth',
  'Unlock the transformative power of professional software quality assurance to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Software Quality Assurance Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Software Quality Assurance for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Playwright"},{"name":"Cypress"},{"name":"Selenium"},{"name":"Jest"},{"name":"Vitest"},{"name":"Puppeteer"},{"name":"k6"},{"name":"Postman"},{"name":"SonarQube"},{"name":"GitHub Actions"},{"name":"Docker"},{"name":"Python"},{"name":"TypeScript"},{"name":"Appium"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our software quality assurance services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical software quality assurance engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Software Quality Assurance Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Software Quality Assurance Services | Enterprise Solutions | FlaireStack',
  'Professional software quality assurance services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'software-quality-assurance'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- mobile-app-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'mobile-app-development',
  'Mobile App Development',
  'Native and cross-platform mobile apps with premium UX and offline resilience.',
  'We build mobile experiences that feel effortless — performant, intuitive, and engineered for App Store excellence across iOS and Android.',
  'Smartphone',
  4,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Mobile App Development Company',
  'For over a decade, we''ve delivered innovative, high-impact mobile applications that drive growth and create lasting value for enterprise businesses worldwide.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Challenges We''ve Solved',
  'Mobile app growth comes with unique challenges — and we''re built to solve them. From streamlining user experiences to optimizing performance and scalability, we tackle the complexities holding your app back.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Low User Engagement","description":"We''ve reversed user decline by building high-performing apps that re-engage existing users and attract new audiences, driving sustainable growth."},{"title":"Slow Market Entry","description":"We help clients launch scalable MVPs rapidly, enabling market entry and regional expansion without costly restructuring or rebuilds."},{"title":"Poor User Experience","description":"We eliminate friction by transforming poor experiences into intuitive journeys that increase engagement and foster long-term loyalty."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Mobile App Development Framework',
  'We deliver tailored mobile solutions across native, cross-platform, hybrid, and progressive web technologies — ensuring the perfect fit for your business goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Native Android Development","description":"We leverage Kotlin and Java to build high-performance Android apps with Material Design, Android APIs, and seamless device integration for robust performance and user satisfaction."},{"title":"Native iOS Development","description":"Using Swift and modern iOS frameworks like SwiftUI, we develop premium applications with exceptional performance, intuitive design, and deep Apple ecosystem integration."},{"title":"Cross-Platform Development","description":"We build once and deploy across iOS and Android using React Native and Flutter — delivering code reusability, faster time-to-market, and simplified maintenance."},{"title":"Hybrid App Development","description":"Our hybrid approach combines web and native technologies for cost-effective development with access to native device features, broad compatibility, and rapid deployment."},{"title":"Progressive Web Apps","description":"We create PWAs with offline functionality, fast loading, and app-like experiences through browsers — no app store download required."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Mobile App Development Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Mobile backends, offline sync, and auth are designed for field teams and consumer apps that cannot afford data leaks or crash loops."},{"title":"Performance optimization at scale","description":"We profile on real devices—not just simulators—so animations stay smooth and battery drain stays reasonable as features grow."},{"title":"Dedicated senior engineering team","description":"Senior iOS, Android, and backend engineers stay on your product from prototype through store submission and post-launch fixes."},{"title":"Transparent agile delivery","description":"TestFlight and internal builds ship regularly so stakeholders try real progress instead of reviewing slide decks."},{"title":"Security & Compliance","description":"Secure storage, token handling, and app store privacy requirements are built into the release process from day one."},{"title":"Transparent Delivery","description":"Store review status, crash reports, and sprint priorities are shared openly so you know exactly where the app stands."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Mobile App Development Drives Growth',
  'Unlock the transformative power of custom mobile apps to forge deeper customer connections, streamline operations, and accelerate business growth.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strengthen Brand Identity","description":"Deliver a premium app experience that builds trust, credibility, and recognition — turning your product into a powerful brand asset."},{"title":"24/7 Customer Support","description":"Intelligent in-app support that handles inquiries instantly and captures opportunities around the clock."},{"title":"Data-Driven Insights","description":"Turn user behavior into actionable intelligence with analytics on preferences, usage patterns, and conversion paths."},{"title":"Boost Revenue & Sales","description":"Increase earnings through subscriptions, in-app purchases, premium features, and targeted monetization strategies."},{"title":"Deeper Customer Relationships","description":"Create intimate connections through personalized experiences, real-time interactions, and dedicated user support."},{"title":"Streamline Operations","description":"Automate processes, improve efficiency, and reduce manual workload with custom app functionality across teams."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Mobile App Development Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Mobile Solutions for Every Industry',
  'We build industry-specific apps that solve real-world problems with domain expertise baked into every sprint.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"React Native"},{"name":"Flutter"},{"name":"Swift"},{"name":"Kotlin"},{"name":"Android"},{"name":"Apple"},{"name":"Firebase"},{"name":"Expo"},{"name":"Fastlane"},{"name":"Redux"},{"name":"GraphQL"},{"name":"TypeScript"},{"name":"Stripe"},{"name":"Google Play"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our mobile app development services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical mobile app development engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Mobile App Development Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Mobile App Development Services | iOS & Android | FlaireStack',
  'Premium mobile app development for iOS and Android. Native and cross-platform apps with scalable architecture, premium UX, and App Store excellence.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'mobile-app-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- it-consultancy
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'it-consultancy',
  'IT Consultancy',
  'Strategic technology advisory for digital transformation and operational excellence.',
  'Our consultants partner with leadership teams to align technology investments with business outcomes — from roadmap planning to vendor selection and governance.',
  'Briefcase',
  5,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom IT Consultancy Company',
  'Our consultants partner with leadership teams to align technology investments with business outcomes — from roadmap planning to vendor selection and governance.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top IT Consultancy Challenges We Have Solved',
  'IT Consultancy comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core IT Consultancy Framework',
  'We deliver tailored it consultancy solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your it consultancy requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized IT Consultancy Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"We help leadership choose platforms and integration patterns that reduce risk instead of accumulating tools that nobody owns."},{"title":"Performance optimization at scale","description":"Recommendations focus on bottlenecks that actually block revenue or operations—not vanity metrics on unused systems."},{"title":"Dedicated senior engineering team","description":"Consultants who have shipped production systems guide your roadmap, vendor selection, and internal team structure."},{"title":"Transparent agile delivery","description":"Workshops, decision logs, and executive summaries keep business and IT aligned on why each recommendation matters."},{"title":"Security & Compliance","description":"Governance models, access policies, and vendor reviews are framed around your regulatory and operational constraints."},{"title":"Transparent Delivery","description":"You get plain-language options with trade-offs spelled out—no jargon-heavy decks that leave executives guessing."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our IT Consultancy Drives Growth',
  'Unlock the transformative power of professional it consultancy to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured IT Consultancy Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized IT Consultancy for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"AWS"},{"name":"Microsoft Azure"},{"name":"Google Cloud"},{"name":"Jira"},{"name":"Confluence"},{"name":"Slack"},{"name":"Notion"},{"name":"Asana"},{"name":"Trello"},{"name":"GitHub"},{"name":"Docker"},{"name":"Kubernetes"},{"name":"Terraform"},{"name":"Salesforce"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our it consultancy services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical it consultancy engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated IT Consultancy Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'IT Consultancy Services | Enterprise Solutions | FlaireStack',
  'Professional it consultancy services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'it-consultancy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- database-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'database-development',
  'Database Development',
  'Scalable data models, migrations, and performance tuning for mission-critical systems.',
  'We design and optimize database architectures — relational, NoSQL, and data warehouses — built for integrity, speed, and enterprise compliance.',
  'Database',
  6,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Database Development Company',
  'We design and optimize database architectures — relational, NoSQL, and data warehouses — built for integrity, speed, and enterprise compliance.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Database Challenges We''ve Solved',
  'Data systems fail silently until scale hits — we design architectures that stay fast, consistent, and secure as volume and complexity grow.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Slow Queries at Scale","description":"We optimize schemas, indexes, and query plans so dashboards and APIs stay responsive under heavy load."},{"title":"Migration Risk","description":"Zero-downtime migrations and replication strategies that move data safely without breaking production."},{"title":"Fragmented Data Silos","description":"Unified models and pipelines that give teams a single source of truth across applications and warehouses."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Database Development Framework',
  'We deliver tailored database development solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your database development requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Database Development Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Schemas and access models are designed for accuracy and auditability, not just to make the first release easy."},{"title":"Performance optimization at scale","description":"Slow reports and APIs get fixed at the query and index level before you pay for bigger hardware every quarter."},{"title":"Dedicated senior engineering team","description":"DBAs and data engineers who have managed production workloads handle modeling, migration, and tuning—not generic script runners."},{"title":"Transparent agile delivery","description":"Migration steps, rollback plans, and validation queries are reviewed with your team before any production cutover."},{"title":"Data Integrity & Governance","description":"Constraints, lineage, and permission boundaries keep teams confident that dashboards reflect one trusted version of the truth."},{"title":"Query Performance at Scale","description":"Partitioning, indexing, and rewrite strategies keep analytics and transactional workloads fast as volume grows."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Database Development Drives Growth',
  'Unlock the transformative power of professional database development to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Database Development Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Database Development for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"PostgreSQL"},{"name":"MySQL"},{"name":"SQL Server"},{"name":"MongoDB"},{"name":"Redis"},{"name":"SQLite"},{"name":"MariaDB"},{"name":"Supabase"},{"name":"Prisma"},{"name":"Elasticsearch"},{"name":"Snowflake"},{"name":"BigQuery"},{"name":"DynamoDB"},{"name":"Apache Kafka"},{"name":"dbt"},{"name":"Firebase"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our database development services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical database development engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Database Development Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Database Development Services | Enterprise Solutions | FlaireStack',
  'Professional database development services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'database-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- e-commerce-website-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'e-commerce-website-development',
  'E-Commerce Website Development',
  'Premium online stores engineered for conversion, inventory, and global scale.',
  'We build headless and platform-native commerce experiences with seamless checkout, inventory sync, and analytics — designed to maximize revenue per visitor.',
  'ShoppingCart',
  7,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom E-Commerce Website Development Company',
  'We build headless and platform-native commerce experiences with seamless checkout, inventory sync, and analytics — designed to maximize revenue per visitor.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top E-Commerce Website Development Challenges We Have Solved',
  'E-Commerce Website Development comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core E-Commerce Website Development Framework',
  'We deliver tailored e-commerce website development solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your e-commerce website development requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized E-Commerce Website Development Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Checkout, inventory, and customer data flows are built to handle peak sales days without cart errors or payment failures."},{"title":"Performance optimization at scale","description":"Product pages, search, and checkout stay fast during campaigns because caching and catalog queries are tuned for traffic spikes."},{"title":"Dedicated senior engineering team","description":"Commerce specialists who understand merchandising, tax, and fulfillment integrations stay embedded through launch and peak season."},{"title":"Transparent agile delivery","description":"Staging previews, UAT with your merchandising team, and go-live rehearsals happen before customers hit the new store."},{"title":"Security & Compliance","description":"PCI-aware payment flows, fraud considerations, and customer data handling follow practices appropriate to your markets."},{"title":"Transparent Delivery","description":"Launch timelines account for catalog migration, payment certification, and marketing cutover—not just theme installation."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our E-Commerce Website Development Drives Growth',
  'Unlock the transformative power of professional e-commerce website development to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured E-Commerce Website Development Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized E-Commerce Website Development for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Shopify"},{"name":"WooCommerce"},{"name":"Magento"},{"name":"BigCommerce"},{"name":"Stripe"},{"name":"PayPal"},{"name":"Next.js"},{"name":"React"},{"name":"Sanity"},{"name":"Algolia"},{"name":"Mailchimp"},{"name":"Google Analytics"},{"name":"Cloudflare"},{"name":"Vercel"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our e-commerce website development services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical e-commerce website development engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated E-Commerce Website Development Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'E-Commerce Website Development Services | Enterprise Solutions | FlaireStack',
  'Professional e-commerce website development services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'e-commerce-website-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- cloud-strategy
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'cloud-strategy',
  'Cloud Strategy',
  'Cloud-native architecture, migration, and cost optimization for modern enterprises.',
  'We help organizations adopt cloud with confidence — multi-cloud strategy, container orchestration, serverless, and FinOps for sustainable growth.',
  'Cloud',
  8,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Cloud Strategy Company',
  'We help organizations adopt cloud with confidence — multi-cloud strategy, container orchestration, serverless, and FinOps for sustainable growth.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Cloud Challenges We''ve Solved',
  'Cloud adoption without strategy leads to cost sprawl and fragile systems — we align architecture, security, and FinOps from day one.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Runaway Cloud Costs","description":"Rightsizing, reserved capacity, and FinOps practices that cut waste without sacrificing performance."},{"title":"Legacy Migration Risk","description":"Phased migration paths that modernize workloads with minimal downtime and clear rollback options."},{"title":"Multi-Cloud Complexity","description":"Consistent deployment patterns and observability across AWS, Azure, and GCP environments."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Cloud Strategy Framework',
  'We deliver tailored cloud strategy solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your cloud strategy requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Cloud Strategy Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Landing zones, network segmentation, and identity policies are designed before workloads move—not after a security review fails."},{"title":"Performance optimization at scale","description":"Auto-scaling, right-sized instances, and observability keep applications responsive while cloud spend stays predictable."},{"title":"Dedicated senior engineering team","description":"Cloud architects who have led migrations define waves, rollback paths, and runbooks your ops team can own long term."},{"title":"Transparent agile delivery","description":"Each migration wave has clear success criteria, cost tracking, and stakeholder sign-off before the next system moves."},{"title":"Security & Compliance","description":"Encryption, logging, and access controls are mapped to your compliance frameworks across AWS, Azure, or GCP."},{"title":"Transparent Delivery","description":"FinOps reviews and architecture decisions are documented so finance and engineering agree on what changed and why."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Cloud Strategy Drives Growth',
  'Unlock the transformative power of professional cloud strategy to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Cloud Strategy Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Cloud Strategy for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"AWS"},{"name":"Microsoft Azure"},{"name":"Google Cloud"},{"name":"Kubernetes"},{"name":"Docker"},{"name":"Terraform"},{"name":"Helm"},{"name":"Ansible"},{"name":"AWS Lambda"},{"name":"Grafana"},{"name":"Prometheus"},{"name":"Argo"},{"name":"Serverless"},{"name":"Cloudflare"},{"name":"Vercel"},{"name":"Pulumi"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our cloud strategy services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical cloud strategy engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Cloud Strategy Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Enterprise Cloud Strategy Services | AWS, Azure, GCP | FlaireStack',
  'Professional cloud strategy consulting for migration, multi-cloud architecture, Kubernetes, and FinOps. Reduce cost and accelerate innovation.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'cloud-strategy'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- ai-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'ai-development',
  'Artificial Intelligence Development Services',
  'Production-ready AI systems — from LLM integration to custom ML pipelines.',
  'We engineer intelligent products with RAG, agents, computer vision, and predictive models — deployed securely with observability and human-in-the-loop safeguards.',
  'Brain',
  9,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Artificial Intelligence Development Services Company',
  'We engineer intelligent products with RAG, agents, computer vision, and predictive models — deployed securely with observability and human-in-the-loop safeguards.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top AI Implementation Challenges We''ve Solved',
  'AI pilots stall when models, data, and production systems aren''t integrated — we ship governed, observable AI that delivers business value.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Prototype-to-Production Gap","description":"MLOps pipelines, eval harnesses, and deployment patterns that move models from demo to production safely."},{"title":"Hallucination & Trust","description":"RAG, guardrails, and human-in-the-loop workflows that keep outputs accurate and auditable."},{"title":"Data Readiness","description":"Vector stores, embedding pipelines, and data governance so models learn from clean, permissioned sources."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Artificial Intelligence Development Services Framework',
  'We deliver tailored artificial intelligence development services solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your artificial intelligence development services requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Artificial Intelligence Development Services Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"LLM & agent orchestration","description":"We connect models to your tools and workflows so assistants draft replies, route tasks, or summarize work—not just chat in a sandbox."},{"title":"RAG & knowledge systems","description":"Answers pull from your approved documents and databases with permission checks, so staff get accurate responses without exposing sensitive files."},{"title":"Model fine-tuning & eval","description":"We measure accuracy on your real scenarios before rollout, tuning prompts or models until outputs meet agreed quality bars."},{"title":"AI safety & governance","description":"Human review, logging, and escalation paths keep high-risk outputs from reaching customers or regulators unchecked."},{"title":"Security & Compliance","description":"Practical artificial intelligence development services support for security & compliance—scoped to your goals, timeline, and team."},{"title":"Transparent Delivery","description":"Practical artificial intelligence development services support for transparent delivery—scoped to your goals, timeline, and team."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Artificial Intelligence Development Services Drives Growth',
  'Unlock the transformative power of professional artificial intelligence development services to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Artificial Intelligence Development Services Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Artificial Intelligence Development Services for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Python"},{"name":"OpenAI"},{"name":"Anthropic"},{"name":"PyTorch"},{"name":"TensorFlow"},{"name":"LangChain"},{"name":"Hugging Face"},{"name":"FastAPI"},{"name":"NumPy"},{"name":"Pandas"},{"name":"Jupyter"},{"name":"scikit-learn"},{"name":"NVIDIA"},{"name":"MLflow"},{"name":"Docker"},{"name":"Ollama"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our artificial intelligence development services services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical artificial intelligence development services engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Artificial Intelligence Development Services Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'AI Development Services | Enterprise LLM & ML Solutions | FlaireStack',
  'Production-ready AI development services including LLM integration, RAG systems, agents, and MLOps. Why businesses need AI solutions built for enterprise scale.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'ai-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- data-analytics
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'data-analytics',
  'Data & Analytics',
  'Turn raw data into actionable intelligence with modern analytics stacks.',
  'We build dashboards, pipelines, and BI systems that empower leaders with real-time insights — from ETL to predictive analytics and executive reporting.',
  'BarChart3',
  10,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Data & Analytics Company',
  'We build dashboards, pipelines, and BI systems that empower leaders with real-time insights — from ETL to predictive analytics and executive reporting.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Data & Analytics Challenges We Have Solved',
  'Data & Analytics comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Data & Analytics Framework',
  'We deliver tailored data & analytics solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your data & analytics requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Data & Analytics Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Pipelines and warehouses are modeled so finance, ops, and product teams share metrics definitions—not conflicting spreadsheet versions."},{"title":"Performance optimization at scale","description":"ETL jobs and dashboards are tuned for daily refresh SLAs, so morning reports are ready when leadership starts the day."},{"title":"Dedicated senior engineering team","description":"Analytics engineers who have built executive reporting own modeling, testing, and documentation—not one-off SQL fixes."},{"title":"Transparent agile delivery","description":"Metric definitions are signed off by business owners before dashboards go company-wide, preventing arguments about the numbers."},{"title":"Security & Compliance","description":"Row-level security, PII handling, and access reviews keep sensitive customer and employee data out of the wrong dashboards."},{"title":"Transparent Delivery","description":"You see pipeline health, data quality checks, and backlog priorities—not a black box that breaks silently on month-end."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Data & Analytics Drives Growth',
  'Unlock the transformative power of professional data & analytics to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Data & Analytics Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Data & Analytics for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Python"},{"name":"Pandas"},{"name":"NumPy"},{"name":"Apache Spark"},{"name":"Apache Airflow"},{"name":"Apache Kafka"},{"name":"dbt"},{"name":"Snowflake"},{"name":"BigQuery"},{"name":"Databricks"},{"name":"Tableau"},{"name":"Looker"},{"name":"Metabase"},{"name":"Grafana"},{"name":"PostgreSQL"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our data & analytics services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical data & analytics engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Data & Analytics Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Data & Analytics Services | Enterprise Solutions | FlaireStack',
  'Professional data & analytics services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'data-analytics'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- business-process-services
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'business-process-services',
  'Business Process Services',
  'Workflow automation and process optimization for operational efficiency.',
  'We map, automate, and optimize business processes — reducing manual overhead with intelligent workflows, integrations, and measurable KPI improvements.',
  'Workflow',
  11,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Business Process Services Company',
  'We map, automate, and optimize business processes — reducing manual overhead with intelligent workflows, integrations, and measurable KPI improvements.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Business Process Services Challenges We Have Solved',
  'Business Process Services comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Business Process Services Framework',
  'We deliver tailored business process services solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your business process services requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Business Process Services Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Automations respect approval chains and audit trails so operations teams can trust what changed and who approved it."},{"title":"Performance optimization at scale","description":"High-volume requests—expenses, vendor onboarding, support tickets—flow through workflows without manual bottlenecks."},{"title":"Dedicated senior engineering team","description":"Process analysts and integration specialists map how work actually happens before any tool is configured."},{"title":"Transparent agile delivery","description":"Pilot groups test new workflows before company-wide rollout, with feedback folded in before go-live."},{"title":"Security & Compliance","description":"Role-based steps and retention rules align automations with HR, finance, and legal requirements."},{"title":"Transparent Delivery","description":"Cycle-time metrics and exception reports show whether automations saved time or created new confusion."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Business Process Services Drives Growth',
  'Unlock the transformative power of professional business process services to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Business Process Services Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Business Process Services for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Zapier"},{"name":"Make"},{"name":"n8n"},{"name":"Salesforce"},{"name":"HubSpot"},{"name":"Slack"},{"name":"Airtable"},{"name":"Notion"},{"name":"Asana"},{"name":"Trello"},{"name":"Jira"},{"name":"Google Sheets"},{"name":"Twilio"},{"name":"Stripe"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our business process services services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical business process services engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Business Process Services Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Business Process Services Services | Enterprise Solutions | FlaireStack',
  'Professional business process services services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'business-process-services'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- digital-marketing
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'digital-marketing',
  'Digital Marketing',
  'Data-driven marketing strategies that amplify brand reach and ROI.',
  'We combine SEO, paid media, content strategy, and analytics to build sustainable growth engines — aligned with your product and conversion funnels.',
  'TrendingUp',
  12,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Digital Marketing Company',
  'We combine SEO, paid media, content strategy, and analytics to build sustainable growth engines — aligned with your product and conversion funnels.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Digital Marketing Challenges We''ve Solved',
  'Campaigns underperform when strategy, creative, and analytics aren''t aligned — we build growth engines tied to measurable revenue outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Low Organic Visibility","description":"Technical SEO, content architecture, and authority-building strategies that compound over time."},{"title":"Wasted Ad Spend","description":"Audience targeting, landing-page optimization, and attribution models that improve ROAS."},{"title":"Siloed Analytics","description":"Unified dashboards connecting product, marketing, and sales funnels for clearer decision-making."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Digital Marketing Framework',
  'We deliver tailored digital marketing solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Search Engine Optimization","description":"Technical SEO, content strategy, and authority building for sustainable organic growth."},{"title":"Paid Media & Campaign Management","description":"Google Ads, Meta Ads, and LinkedIn campaigns optimized for cost-per-acquisition."},{"title":"Analytics & Attribution","description":"Full-funnel tracking, dashboard reporting, and data-driven budget allocation."},{"title":"Content & Brand Strategy","description":"Editorial calendars, thought leadership, and conversion-focused landing pages."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Digital Marketing Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Tracking, consent, and data sharing are set up so campaigns stay measurable without violating privacy expectations."},{"title":"Performance optimization at scale","description":"Landing pages, ad creative, and site speed are tested continuously so budget goes toward what actually converts."},{"title":"Dedicated senior engineering team","description":"Strategists, analysts, and channel specialists work from one plan tied to pipeline and revenue—not siloed channel reports."},{"title":"Transparent agile delivery","description":"Monthly reviews show what moved leads and revenue, with clear next tests instead of vanity metric celebrations."},{"title":"Security & Compliance","description":"Ad platforms, CRM data, and email lists are handled with permissions and retention practices your legal team can stand behind."},{"title":"Transparent Delivery","description":"You see spend, attribution, and creative performance in language leadership understands—not platform jargon alone."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Digital Marketing Drives Growth',
  'Unlock the transformative power of professional digital marketing to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Measurable ROI","description":"Every campaign tied to revenue, leads, and lifetime value — not impressions alone."},{"title":"Enterprise Reporting","description":"Executive dashboards with real-time performance visibility."},{"title":"Integrated Funnel Strategy","description":"Marketing aligned with product, sales, and customer success workflows."},{"title":"Sustainable Growth","description":"Long-term SEO and content assets that compound over time."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Digital Marketing Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Digital Marketing for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Google Analytics"},{"name":"Google Ads"},{"name":"Google Tag Manager"},{"name":"Meta"},{"name":"Semrush"},{"name":"HubSpot"},{"name":"Mailchimp"},{"name":"Hotjar"},{"name":"WordPress"},{"name":"YouTube"},{"name":"Instagram"},{"name":"LinkedIn"},{"name":"TikTok"},{"name":"Buffer"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our digital marketing services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical digital marketing engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Digital Marketing Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Enterprise Digital Marketing Services | SEO & Growth | FlaireStack',
  'Data-driven digital marketing with SEO, paid media, analytics, and growth strategy. Premium campaigns engineered for measurable ROI and brand authority.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'digital-marketing'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- graphic-design
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'graphic-design',
  'Graphic Design',
  'Visual identity and creative assets that elevate your brand presence.',
  'Our designers craft cohesive brand systems — logos, marketing collateral, and campaign visuals with cinematic polish and enterprise consistency.',
  'Palette',
  13,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Graphic Design Company',
  'Our designers craft cohesive brand systems — logos, marketing collateral, and campaign visuals with cinematic polish and enterprise consistency.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Brand Design Challenges We''ve Solved',
  'Inconsistent visuals erode trust — we create cohesive brand systems that scale across every channel and touchpoint.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Fragmented Brand Identity","description":"Logo systems, typography, and color standards documented for teams and partners to follow."},{"title":"Campaign Turnaround Pressure","description":"Template libraries and production workflows that deliver premium assets on tight deadlines."},{"title":"Off-Brand Collateral","description":"Guidelines and review processes that keep marketing, product, and sales materials aligned."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Graphic Design Framework',
  'We deliver tailored graphic design solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your graphic design requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Graphic Design Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Brand files, templates, and usage rules are organized so partners and internal teams apply identity correctly at scale."},{"title":"Performance optimization at scale","description":"Reusable templates and asset libraries speed campaign turnaround without sacrificing visual quality."},{"title":"Dedicated senior engineering team","description":"Senior designers who understand B2B and consumer contexts lead concept through final production files."},{"title":"Transparent agile delivery","description":"Revision rounds are structured with clear feedback loops so approvals do not stall launches indefinitely."},{"title":"Security & Compliance","description":"Licensed assets, trademark usage, and partner guidelines are documented to reduce brand and legal risk."},{"title":"Transparent Delivery","description":"You receive production-ready files with naming and specs your print, web, and sales teams can use immediately."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Graphic Design Drives Growth',
  'Unlock the transformative power of professional graphic design to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Graphic Design Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Graphic Design for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Figma"},{"name":"Adobe Photoshop"},{"name":"Adobe Illustrator"},{"name":"Adobe After Effects"},{"name":"Adobe Premiere Pro"},{"name":"Canva"},{"name":"Sketch"},{"name":"Blender"},{"name":"Affinity Designer"},{"name":"Dribbble"},{"name":"Behance"},{"name":"InVision"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our graphic design services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical graphic design engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Graphic Design Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Graphic Design Services | Enterprise Solutions | FlaireStack',
  'Professional graphic design services for enterprise organizations. Scalable solutions, senior engineering teams, and measurable business outcomes.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'graphic-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- ui-ux-design
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'ui-ux-design',
  'UI/UX Design Services',
  'Human-centered design systems that balance beauty, usability, and conversion.',
  'We design intuitive interfaces through research, wireframing, prototyping, and usability testing — creating experiences users love and businesses trust.',
  'Layout',
  14,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom UI/UX Design Services Company',
  'We design intuitive interfaces through research, wireframing, prototyping, and usability testing — creating experiences users love and businesses trust.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top UI/UX Design Services Challenges We Have Solved',
  'UI/UX Design Services comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core UI/UX Design Services Framework',
  'We deliver tailored ui/ux design services solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Strategy & Discovery","description":"Comprehensive assessment of your ui/ux design services requirements, constraints, and success metrics."},{"title":"Architecture & Design","description":"Scalable system design with enterprise security and performance benchmarks."},{"title":"Implementation & Testing","description":"Agile delivery with automated quality assurance and transparent progress reporting."},{"title":"Launch & Optimization","description":"Production deployment, monitoring, and continuous improvement cycles."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized UI/UX Design Services Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Design systems encode patterns for forms, tables, and auth flows so complex products stay usable as they grow."},{"title":"Performance optimization at scale","description":"Prototypes are tested with real users on key tasks before engineering spends months building the wrong flow."},{"title":"Dedicated senior engineering team","description":"Researchers and designers pair on discovery, wireframes, and handoff specs engineers can implement without guesswork."},{"title":"Transparent agile delivery","description":"You review clickable prototypes and usability findings at each phase—not only polished visuals at the end."},{"title":"Security & Compliance","description":"Sensitive flows—payments, health data, permissions—are designed for clarity and error prevention, not just aesthetics."},{"title":"Transparent Delivery","description":"Figma files, component docs, and rationale travel with the work so your team maintains consistency after launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our UI/UX Design Services Drives Growth',
  'Unlock the transformative power of professional ui/ux design services to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise Quality","description":"Production-grade deliverables with documentation and knowledge transfer."},{"title":"Senior Expertise","description":"Dedicated team of experienced specialists embedded in your workflow."},{"title":"Scalable Solutions","description":"Architecture designed to grow with your organization and user base."},{"title":"Measurable Outcomes","description":"KPI-driven delivery with clear ROI tracking and executive reporting."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured UI/UX Design Services Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized UI/UX Design Services for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Figma"},{"name":"Framer"},{"name":"Sketch"},{"name":"Adobe XD"},{"name":"Storybook"},{"name":"Webflow"},{"name":"Miro"},{"name":"Penpot"},{"name":"InVision"},{"name":"Notion"},{"name":"Hotjar"},{"name":"Canva"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our ui/ux design services services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical ui/ux design services engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated UI/UX Design Services Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'UI/UX Design Services | Enterprise Design Systems | FlaireStack',
  'Professional UI/UX design services for SaaS and enterprise products. Research, prototyping, design systems, and usability testing that drives conversion.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'ui-ux-design'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

-- ---------------------------------------------------------------------------
-- game-development
-- ---------------------------------------------------------------------------

INSERT INTO public.services (
  slug,
  title,
  short_description,
  description,
  icon_name,
  sort_order,
  status,
  published_at
)
VALUES (
  'game-development',
  'Game Development Services',
  'Immersive game experiences built with modern engines and multiplayer architecture.',
  'From mobile casual to AAA-style experiences, we develop games with stunning visuals, optimized performance, and scalable backend infrastructure.',
  'Gamepad2',
  15,
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'hero',
  NULL,
  'Custom Game Development Services Company',
  'From mobile casual to AAA-style experiences, we develop games with stunning visuals, optimized performance, and scalable backend infrastructure.',
  NULL,
  'Start Your Project',
  '#contact',
  'View Our Process',
  '#process',
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'hero'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'challenges',
  NULL,
  'Top Game Development Services Challenges We Have Solved',
  'Game Development Services comes with unique enterprise challenges. We streamline complexity — from architecture and performance to scalability and time-to-market.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Technical Debt & Scale","description":"We modernize legacy systems and architect scalable foundations that support growth without costly rewrites."},{"title":"Slow Delivery Cycles","description":"Our agile squads accelerate release velocity with transparent reporting and production-ready increments every sprint."},{"title":"Poor User Adoption","description":"We transform friction-heavy experiences into intuitive journeys that drive engagement and long-term retention."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'challenges'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'framework',
  NULL,
  'Our Core Game Development Services Framework',
  'We deliver tailored game development services solutions engineered for performance, security, and measurable business outcomes.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Unity & Unreal Engine Development","description":"Full-cycle game builds using industry-standard engines and modern rendering pipelines."},{"title":"3D Environment & Asset Creation","description":"Level design, character modeling, and cinematic environment art direction."},{"title":"Multiplayer & Backend Systems","description":"Netcode, matchmaking, leaderboards, and cloud-hosted game server architecture."},{"title":"Performance Optimization","description":"Frame rate tuning, asset streaming, and platform-specific optimization."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'framework'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'features',
  NULL,
  'Specialized Game Development Services Capabilities',
  'Focused expertise areas our teams bring to every engagement — distinct from our core service framework and business outcomes below.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Enterprise-grade architecture and security","description":"Multiplayer, accounts, and in-game economies are architected for cheating resistance and stable live operations."},{"title":"Performance optimization at scale","description":"Frame rates, load times, and asset streaming are profiled on target hardware—not just high-end dev machines."},{"title":"Dedicated senior engineering team","description":"Gameplay, art, and backend engineers collaborate from vertical slice through certification and live ops."},{"title":"Transparent agile delivery","description":"Milestone builds are playable on schedule so publishers and stakeholders judge fun and stability, not promises."},{"title":"Security & Compliance","description":"Platform requirements, age ratings, and player data policies are tracked through submission and update cycles."},{"title":"Transparent Delivery","description":"Backlog, bug triage, and live-ops priorities stay visible so you know what ships in the next patch versus the next season."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'features'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'growth',
  NULL,
  'How Our Game Development Services Drives Growth',
  'Unlock the transformative power of professional game development services to accelerate revenue, streamline operations, and deepen customer relationships.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Cinematic Visual Quality","description":"Lighting, shaders, and art direction that rival AAA production values."},{"title":"Cross-Platform Reach","description":"Deploy to mobile, PC, and console from unified engine workflows."},{"title":"Scalable Live Ops","description":"Backend systems supporting updates, events, and monetization at scale."},{"title":"Experienced Dev Team","description":"Engineers and artists who understand both creative vision and technical constraints."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'growth'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'testimonials',
  NULL,
  'Client Testimonials',
  'What our partners say about working with FlaireStack.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'testimonials'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'process',
  NULL,
  'Our Structured Game Development Services Approach',
  'Excellence drives everything we build. From blueprint to launch, our lifecycle embeds quality into every stage — delivering scalable solutions that exceed your goals.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"steps":[{"step":"01","title":"Discovery","text":"We align on business goals, users, and success metrics — mapping requirements and opportunities before build begins."},{"step":"02","title":"Strategy","text":"Architecture, timelines, and delivery plans are defined with stakeholders for measurable outcomes every sprint."},{"step":"03","title":"Design","text":"Wireframes and high-fidelity UI/UX translate your vision into intuitive, conversion-focused experiences."},{"step":"04","title":"Development","text":"Senior engineers ship production-grade features using modern, secure, and scalable technology stacks."},{"step":"05","title":"Testing","text":"Automated and manual QA across environments ensures performance, security, and reliability before launch."},{"step":"06","title":"Launch & Scale","text":"We deploy, monitor, and optimize — supporting growth with DevOps and iterative improvements post-launch."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'process'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'industries',
  NULL,
  'Specialized Game Development Services for Every Industry',
  'We build domain-specific solutions that solve real-world problems with deep industry knowledge.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Healthcare","description":"HIPAA-aware platforms, patient engagement apps, and telemedicine solutions for modern care delivery."},{"title":"Fintech","description":"Secure banking apps, payment gateways, digital wallets, and investment management platforms."},{"title":"E-Commerce","description":"Shopping apps with secure checkout, personalization, inventory sync, and real-time order tracking."},{"title":"Education","description":"E-learning platforms, LMS solutions, and interactive tutoring experiences."},{"title":"Logistics","description":"Fleet management, delivery tracking, and supply chain optimization tools."},{"title":"Enterprise","description":"Scalable B2B solutions with RBAC, analytics, security, and custom workflows."},{"title":"SaaS","description":"Multi-tenant platforms engineered for growth, retention, and subscription revenue."},{"title":"Real Estate","description":"Property listing apps, virtual tours, CRM integrations, and agent communication tools."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'industries'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'tech',
  NULL,
  'Technologies We Work With',
  'A curated stack of proven tools and platforms — chosen for performance, maintainability, and long-term reliability on every engagement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"name":"Unity"},{"name":"Unreal Engine"},{"name":"C#"},{"name":"C++"},{"name":"Godot"},{"name":"Blender"},{"name":"Autodesk Maya"},{"name":"Steam"},{"name":"PlayStation"},{"name":"Xbox"},{"name":"Android"},{"name":"Apple"},{"name":"WebGL"}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'tech'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'post_launch',
  NULL,
  'Post-Launch Services You Can Count On',
  'Launch day is just the beginning. We provide managed post-launch services to ensure your product remains powerful, secure, and user-centric.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"title":"Post-Launch Support","description":"Immediate expert support after deployment to resolve issues and ensure operational stability from day one."},{"title":"Optimization","description":"Continuous performance refinements that keep your product fast, efficient, and aligned with user expectations."},{"title":"Engagement","description":"Strategic feature updates and UX improvements that drive retention and keep users actively engaged."},{"title":"Iteration","description":"Data-informed releases that evolve with market trends and deliver lasting product value."},{"title":"Security","description":"Proactive threat mitigation, patching, and compliance maintenance for enterprise-grade protection."},{"title":"Performance","description":"Real-time monitoring and preemptive fixes that ensure uninterrupted, exceptional experiences."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'post_launch'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'faq',
  NULL,
  'Frequently Asked Questions',
  'Common questions about our game development services services.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  '{"items":[{"question":"How long does a typical game development services engagement take?","answer":"Timelines vary by scope, but most enterprise engagements run 8–16 weeks from discovery to launch, with phased delivery for larger programs."},{"question":"Do you work with existing in-house teams?","answer":"Yes. We integrate with your engineers, designers, and product leaders — augmenting capacity without disrupting established workflows."},{"question":"What industries do you serve?","answer":"We partner with SaaS, fintech, healthcare, e-commerce, media, and AI-native startups across North America, Europe, and the Middle East."},{"question":"How do you ensure quality and security?","answer":"Every engagement follows enterprise SDLC standards: code review, automated testing, security scanning, and documented handoff procedures."}]}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'faq'
  );

INSERT INTO public.service_sections (
  service_id,
  section_key,
  eyebrow,
  title,
  intro,
  body,
  cta_label,
  cta_url,
  secondary_cta_label,
  secondary_cta_url,
  use_global_template,
  global_template_key,
  config,
  is_enabled
)
SELECT
  s.id,
  'final_cta',
  NULL,
  'Top-Rated Game Development Services Company',
  'If you can''t find what you''re looking for, reach out — we''ll respond promptly to assist you.',
  NULL,
  'Send Message',
  '#contact',
  NULL,
  NULL,
  false,
  NULL,
  '{}'::jsonb,
  true
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_sections ss
    WHERE ss.service_id = s.id
      AND ss.section_key = 'final_cta'
  );

INSERT INTO public.seo_metadata (
  entity_type,
  service_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'service'::public.entity_type,
  s.id,
  'Game Development Services | Unity & Unreal Engine | FlaireStack',
  'Professional game development with Unity and Unreal Engine. Cinematic visuals, multiplayer architecture, and scalable backend infrastructure.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.services s
WHERE s.slug = 'game-development'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.service_id = s.id
  );

COMMIT;
