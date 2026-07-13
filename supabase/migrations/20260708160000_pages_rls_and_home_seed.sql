-- =============================================================================
-- FlaireStack CMS — pages / page_sections RLS + Home page seed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seed Home page (before RLS — admin-only INSERT policies block bootstrap rows)
-- -----------------------------------------------------------------------------

INSERT INTO public.pages (
  slug,
  title,
  route_path,
  status,
  published_at
)
VALUES (
  'home',
  'Home',
  '/',
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'home') THEN
    RAISE EXCEPTION 'Home page seed failed: pages row with slug = home was not created';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Seed Home page sections (idempotent per section_key)
-- -----------------------------------------------------------------------------

-- hero
INSERT INTO public.page_sections (
  page_id,
  section_key,
  title,
  title_accent,
  intro,
  body,
  cta_primary_label,
  cta_primary_url,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'hero',
  'Building intelligent',
  'digital experiences',
  'for the future.',
  'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.',
  'Book Consultation',
  '#contact',
  '{}'::jsonb,
  0,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- services
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  intro,
  body,
  cta_primary_label,
  cta_primary_url,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'services',
  'Our services',
  'Redefining',
  'digital impact',
  'across the globe.',
  'From AI-native platforms to cloud infrastructure — we partner with ambitious teams to design, build, and scale products that feel cinematic, resilient, and ready for enterprise.',
  'Get in touch',
  '#contact',
  $json${
    "visual_alt": "FlaireStack service platform: code, AI, cloud, and analytics connected",
    "panel_label": "Why FlaireStack",
    "details": [
      "We embed expert product engineers, cloud architects, and AI specialists into your roadmap to reduce delivery risk, accelerate release velocity, and improve platform reliability at scale.",
      "Whether you are launching a new product, modernizing legacy systems, or scaling AI across operations, we work as an extension of your team — with transparent sprints, senior ownership, and delivery tied to business outcomes."
    ],
    "points": [
      "Enterprise-grade architecture and governance",
      "Product-led UX with measurable conversion impact",
      "Continuous delivery with quality and security by design",
      "Cloud-native infrastructure, FinOps, and observability",
      "AI integration, automation, and intelligent workflows"
    ]
  }$json$::jsonb,
  1,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- why-choose
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  intro,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'why-choose',
  'The FlaireStack difference',
  'Why choose',
  'FlaireStack',
  'Partner with a software development team that combines senior engineering, premium design, and AI-native thinking — so your product ships faster, scales reliably, and wins in the market.',
  $json${
    "items": [
      {
        "title": "Scalable architecture",
        "description": "We design cloud-native systems, APIs, and data layers that grow from MVP to millions of users — without costly rewrites or downtime.",
        "icon_name": "Layers"
      },
      {
        "title": "Modern technologies",
        "description": "React, Next.js, Node, Python, AWS, and proven AI stacks — chosen for performance, maintainability, and long-term team velocity.",
        "icon_name": "Cpu"
      },
      {
        "title": "Fast delivery",
        "description": "Agile squads ship production-ready increments every sprint with clear milestones, demos, and transparent progress you can track.",
        "icon_name": "Rocket"
      },
      {
        "title": "Security-first systems",
        "description": "Encryption, access control, compliance-aware workflows, and secure SDLC practices built into every phase of development.",
        "icon_name": "Shield"
      },
      {
        "title": "Premium UI/UX",
        "description": "Research-driven interfaces and design systems that improve adoption, reduce friction, and strengthen brand trust across every touchpoint.",
        "icon_name": "Layout"
      },
      {
        "title": "AI automation expertise",
        "description": "LLM integrations, intelligent workflows, and automation that save time — deployed responsibly with evaluation, monitoring, and governance.",
        "icon_name": "Brain"
      }
    ]
  }$json$::jsonb,
  2,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- stats
INSERT INTO public.page_sections (
  page_id,
  section_key,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'stats',
  $json${
    "stats": [
      { "value": 60, "suffix": "+", "label": "Enterprise Projects" },
      { "value": 98, "suffix": "%", "label": "Client Satisfaction" },
      { "value": 5, "suffix": "+", "label": "Years Experience" },
      { "value": 40, "suffix": "+", "label": "Successful Launches" }
    ]
  }$json$::jsonb,
  3,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- testimonials
INSERT INTO public.page_sections (
  page_id,
  section_key,
  title,
  title_accent,
  intro,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'testimonials',
  'Our clients simply love',
  'what we do',
  'Proud to serve as the innovation partner for industry leaders who have experienced our expertise and excellence firsthand.',
  $json${
    "trust_badges": [
      { "platform": "clutch", "letter": "C", "reviews": 52 },
      { "platform": "goodfirms", "letter": "G", "reviews": 32 }
    ],
    "items": [
      {
        "quote": "FlaireStack managed to deliver our platform on time with exceptional quality. The app is preparing for beta launch and has received overwhelmingly positive feedback from stakeholders and early users alike.",
        "author": "David Chen",
        "role": "CEO, NovaPay Systems",
        "initials": "DC"
      },
      {
        "quote": "They took the time to truly understand our workflows and built custom solutions around how we operate. Transparent communication, reliable delivery, and senior engineers who feel like an extension of our team.",
        "author": "Sarah Mitchell",
        "role": "CTO, LedgerFlow",
        "initials": "SM"
      },
      {
        "quote": "Our cloud migration was seamless. FlaireStack's technical depth and proactive planning eliminated downtime risks and gave us a modern stack we can scale for years.",
        "author": "James Okonkwo",
        "role": "Product Director, ValidStack",
        "initials": "JO"
      },
      {
        "quote": "From discovery through launch, every sprint had clear milestones and demos. The design-led approach helped us ship a product our customers actually adopt faster than we projected.",
        "author": "Elena Vasquez",
        "role": "VP Engineering, Atlas Health",
        "initials": "EV"
      },
      {
        "quote": "We needed AI integrated into an existing enterprise product — not a science project. FlaireStack shipped production-ready ML features with monitoring, guardrails, and documentation our team could own.",
        "author": "Marcus Lee",
        "role": "Head of Product, Synapse AI",
        "initials": "ML"
      },
      {
        "quote": "Security and compliance were non-negotiable for our fintech rollout. Their security-first SDLC, audit trails, and penetration testing gave our board confidence to go live on schedule.",
        "author": "Priya Sharma",
        "role": "COO, Northline Finance",
        "initials": "PS"
      },
      {
        "quote": "The mobile experience they built rivals apps from companies ten times our size. Performance, accessibility, and polish across iOS and Android exceeded what we thought was possible on our budget.",
        "author": "Alex Rivera",
        "role": "Founder, Pulse Mobility",
        "initials": "AR"
      },
      {
        "quote": "FlaireStack rebuilt our analytics dashboard from the ground up. Executives finally have real-time KPIs they trust, and our data team spends less time firefighting broken reports.",
        "author": "Hannah Brooks",
        "role": "Director of Data, Meridian Retail",
        "initials": "HB"
      },
      {
        "quote": "What stood out was accountability. When scope shifted, they re-estimated honestly, adjusted the roadmap, and still hit our launch window without cutting corners on quality.",
        "author": "Tom Andersson",
        "role": "Engineering Manager, CloudForge",
        "initials": "TA"
      },
      {
        "quote": "We have partnered with several agencies before. FlaireStack is the first team that combined strategic thinking, beautiful UX, and engineering discipline in one engagement — we are already planning phase two.",
        "author": "Rachel Kim",
        "role": "CMO, Brightpath Education",
        "initials": "RK"
      }
    ]
  }$json$::jsonb,
  4,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- process
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  intro,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'process',
  'How we deliver',
  'Our',
  'Process',
  'A proven six-step framework that keeps projects transparent, on schedule, and built for long-term success — from first workshop to production scale.',
  $json${
    "icons": ["Search", "Compass", "Palette", "Code2", "FlaskConical", "Rocket"],
    "steps": [
      {
        "step": "01",
        "title": "Discovery & Consultation",
        "text": "We begin by understanding your business goals, target audience, challenges, and project requirements. Through collaborative discussions, we identify opportunities, define success metrics, and create a clear roadmap for development."
      },
      {
        "step": "02",
        "title": "Strategy & Planning",
        "text": "Our team develops a comprehensive project strategy, including technical architecture, timelines, feature prioritization, and growth objectives. Every decision is aligned with your business goals and long-term scalability."
      },
      {
        "step": "03",
        "title": "UI/UX Design",
        "text": "We create intuitive user experiences and modern interface designs that enhance usability, strengthen brand identity, and improve customer engagement across all devices."
      },
      {
        "step": "04",
        "title": "Development & Integration",
        "text": "Using modern web technologies and industry best practices, we build secure, scalable, and high-performance digital solutions tailored to your business needs and future growth."
      },
      {
        "step": "05",
        "title": "Quality Assurance & Testing",
        "text": "Every project undergoes rigorous testing for functionality, performance, security, responsiveness, and user experience to ensure a seamless and reliable product launch."
      },
      {
        "step": "06",
        "title": "Launch, Support & Growth",
        "text": "After deployment, we continue to monitor performance, provide ongoing support, implement improvements, and help your business scale through optimization, analytics, and continuous innovation."
      }
    ]
  }$json$::jsonb,
  5,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- technologies
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  intro,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'technologies',
  'Tech stack',
  'Technologies we',
  'work with',
  'Modern frameworks, clouds, databases, and AI platforms — integrated with the tools your teams already use.',
  $json${
    "row_a": [
      "React", "Next.js", "TypeScript", "Node.js", "JavaScript", "Python", "Go", "Rust", ".NET",
      "OpenJDK", "Spring", "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform",
      "Angular", "Vue.js", "Svelte", "Django", "FastAPI"
    ],
    "row_b": [
      "PostgreSQL", "MongoDB", "Redis", "MySQL", "Firebase", "Supabase", "GraphQL", "Prisma",
      "OpenAI", "TensorFlow", "PyTorch", "Apache Spark", "RabbitMQ", "Apache Kafka", "Elasticsearch",
      "Snowflake", "dbt", "Tailwind CSS", "Vite", "Vercel", "NGINX", "Linux", "GitHub", "GitLab",
      "Figma", "Flutter", "Swift", "Kotlin", "TanStack Query", "Jest", "Cypress", "Stripe", "Shopify"
    ]
  }$json$::jsonb,
  6,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- contact
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  body,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'contact',
  'Start a project',
  'Let''s Build Something',
  'Exceptional Together',
  'Partner with FlaireStack for cinematic digital products engineered with precision — from intelligent automation to mission-critical platforms that scale globally.',
  $json${
    "capabilities": [
      "AI solutions",
      "Enterprise software",
      "Scalable digital products",
      "Cloud systems",
      "Custom development services"
    ],
    "trust_items": [
      { "icon_name": "Clock", "text": "Response within 1 business day" },
      { "icon_name": "Shield", "text": "NDA & enterprise security practices" },
      { "icon_name": "Sparkles", "text": "Premium engineering execution powered by modern AI systems" }
    ]
  }$json$::jsonb,
  7,
  true
FROM public.pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed Home SEO metadata
-- -----------------------------------------------------------------------------

INSERT INTO public.seo_metadata (
  entity_type,
  page_id,
  meta_title,
  meta_description,
  robots,
  og_type,
  twitter_card,
  status,
  published_at
)
SELECT
  'page'::public.entity_type,
  p.id,
  'FlaireStack | AI-First Software Development Studio',
  'FlaireStack is an AI-first software development studio delivering custom applications, cloud-native platforms, and intelligent automation with the latest technologies — from LLMs and modern frameworks to secure, scalable infrastructure.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.pages p
WHERE p.slug = 'home'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.page_id = p.id
  );



-- -----------------------------------------------------------------------------
-- pages — Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'pages_public_read'
  ) THEN
    CREATE POLICY pages_public_read
      ON public.pages
      FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'pages_admin_insert'
  ) THEN
    CREATE POLICY pages_admin_insert
      ON public.pages
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'pages_admin_update'
  ) THEN
    CREATE POLICY pages_admin_update
      ON public.pages
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'pages_admin_delete'
  ) THEN
    CREATE POLICY pages_admin_delete
      ON public.pages
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;

-- -----------------------------------------------------------------------------
-- page_sections — Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_sections' AND policyname = 'page_sections_public_read'
  ) THEN
    CREATE POLICY page_sections_public_read
      ON public.page_sections
      FOR SELECT
      TO anon, authenticated
      USING (
        is_enabled = true
        AND EXISTS (
          SELECT 1
          FROM public.pages p
          WHERE p.id = page_sections.page_id
            AND p.status = 'published'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_sections' AND policyname = 'page_sections_admin_insert'
  ) THEN
    CREATE POLICY page_sections_admin_insert
      ON public.page_sections
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_sections' AND policyname = 'page_sections_admin_update'
  ) THEN
    CREATE POLICY page_sections_admin_update
      ON public.page_sections
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_sections' AND policyname = 'page_sections_admin_delete'
  ) THEN
    CREATE POLICY page_sections_admin_delete
      ON public.page_sections
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT ON public.page_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;

