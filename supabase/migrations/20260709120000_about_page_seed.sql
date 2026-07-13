-- =============================================================================
-- FlaireStack CMS — About page seed
-- Idempotent bootstrap for pages, page_sections, and seo_metadata.
-- =============================================================================

INSERT INTO public.pages (
  slug,
  title,
  route_path,
  status,
  published_at
)
VALUES (
  'about',
  'About',
  '/about',
  'published'::public.content_status,
  now()
)
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'about') THEN
    RAISE EXCEPTION 'About page seed failed: pages row with slug = about was not created';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- About page sections (idempotent per section_key)
-- -----------------------------------------------------------------------------

-- hero
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
  'hero',
  'About us',
  'The team behind',
  'FlaireStack',
  'We are an AI-first software studio helping ambitious organizations design, build, and scale digital products with senior engineering, premium design, and transparent delivery.',
  '{}'::jsonb,
  0,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- company-story
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
  'company-story',
  'Who we are',
  'About',
  'FlaireStack',
  'FlaireStack is an AI-first software development company specializing in custom web applications, enterprise software, mobile apps, cloud strategy, and intelligent automation — helping ambitious teams build scalable digital products that drive growth.',
  $json${
    "stats": [
      {
        "value": "60+",
        "label": "Projects delivered",
        "description": "End-to-end web development, software engineering, mobile apps, and AI solutions launched for startups and enterprise teams worldwide.",
        "icon_name": "Briefcase"
      },
      {
        "value": "25+",
        "label": "Clients partnered",
        "description": "Long-term partnerships across SaaS, fintech, healthcare, and e-commerce — with transparent delivery and measurable business outcomes.",
        "icon_name": "Users"
      },
      {
        "value": "5+",
        "label": "Years of expertise",
        "description": "Senior engineers, designers, and strategists with deep experience in cloud architecture, UX, and production-grade product development.",
        "icon_name": "Award"
      },
      {
        "value": "3",
        "label": "Countries served",
        "description": "Remote-first delivery supporting organizations in North America, Europe, the Middle East, and beyond with 24/7 collaboration options.",
        "icon_name": "Globe"
      }
    ]
  }$json$::jsonb,
  1,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- mission
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
  'mission',
  'Our mission',
  'Building digital experiences that',
  'drive growth',
  'At FlaireStack, our mission is to help businesses transform their digital presence through innovative web solutions, modern technology, and exceptional user experiences. We believe every company deserves a website that not only looks professional but also drives growth, builds trust, and creates lasting customer relationships. Our goal is to combine creativity, strategy, and technology to deliver solutions that help businesses stand out in an increasingly competitive digital world.',
  '{}'::jsonb,
  2,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- vision
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
  'vision',
  'Our vision',
  'Software that performs',
  'in production',
  'We blend artificial intelligence with world-class engineering to help organizations design, build, and scale software that performs in production — not just in presentations.',
  '{}'::jsonb,
  3,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- values
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'values',
  'What we stand for',
  'Our',
  'values',
  $json${
    "items": [
      {
        "title": "AI-first engineering",
        "text": "We integrate machine learning, automation, and intelligent workflows into products built for real-world scale.",
        "icon_name": "Sparkles"
      },
      {
        "title": "Design-led delivery",
        "text": "Human-centered UI/UX and conversion-focused interfaces that help users adopt and trust your product faster.",
        "icon_name": "Target"
      },
      {
        "title": "Ship with confidence",
        "text": "Agile sprints, security best practices, and DevOps pipelines that take ideas from discovery to production reliably.",
        "icon_name": "Zap"
      }
    ]
  }$json$::jsonb,
  4,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- team
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'team',
  'Leadership',
  'Meet our',
  'co-founders',
  $json${
    "members": [
      {
        "id": "founder-1",
        "name": "Syed Talha Hussain",
        "title": "Co-Founder & CEO",
        "bio": "Talha leads strategy, client partnerships, and product vision at FlaireStack. With a background in scaling digital agencies and enterprise software programs, he ensures every engagement aligns technology investments with measurable business outcomes.",
        "image_alt": "Syed Talha Hussain, Co-Founder and CEO of FlaireStack",
        "image_position": "center 18%",
        "image_path": null
      },
      {
        "id": "founder-2",
        "name": "Muhammad Salman Iqbal",
        "title": "Co-Founder & CTO",
        "bio": "Salman architects FlaireStack's engineering practice from cloud-native platforms and AI integrations to delivery standards that keep products secure, performant, and maintainable long after launch.",
        "image_alt": "Muhammad Salman Iqbal, Co-Founder and CTO of FlaireStack",
        "image_position": "center 20%",
        "image_path": null
      }
    ]
  }$json$::jsonb,
  5,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- contact
INSERT INTO public.page_sections (
  page_id,
  section_key,
  eyebrow,
  title,
  title_accent,
  body,
  cta_primary_label,
  cta_primary_url,
  config,
  sort_order,
  is_enabled
)
SELECT
  p.id,
  'contact',
  'Get in touch',
  'Let''s build something',
  'great together',
  'Ready to partner with a senior team on your next product, platform, or AI initiative? Tell us about your goals and we will respond within one business day.',
  'Start a project',
  '/#contact',
  '{}'::jsonb,
  6,
  true
FROM public.pages p
WHERE p.slug = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- About page SEO metadata
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
  'About Us | FlaireStack',
  'Meet the FlaireStack team — an AI-first software studio helping ambitious organizations design, build, and scale digital products with senior engineering, premium design, and transparent delivery.',
  'index,follow',
  'website',
  'summary_large_image',
  'published'::public.content_status,
  now()
FROM public.pages p
WHERE p.slug = 'about'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seo_metadata sm
    WHERE sm.page_id = p.id
  );
