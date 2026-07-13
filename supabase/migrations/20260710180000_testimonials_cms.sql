-- =============================================================================
-- FlaireStack CMS — testimonials table, RLS, grants, and seed
-- =============================================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null default '',
  position text not null default '',
  testimonial text not null,
  rating integer not null default 5
    check (rating >= 1 and rating <= 5),
  photo_path text,
  company_logo_path text,
  sort_order integer not null default 0
    check (sort_order >= 0),
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  stat text,
  stat_label text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  constraint testimonials_published_at_check
    check (
      (status = 'published' and published_at is not null)
      or (status <> 'published')
    )
);

create index if not exists testimonials_status_sort_idx
  on public.testimonials (status, sort_order);

create index if not exists testimonials_published_sort_idx
  on public.testimonials (sort_order)
  where status = 'published';

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Grants + RLS
-- -----------------------------------------------------------------------------

grant select on table public.testimonials to anon, authenticated;
grant insert, update, delete on table public.testimonials to authenticated;

alter table public.testimonials enable row level security;

drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read
  on public.testimonials
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists testimonials_admin_read on public.testimonials;
create policy testimonials_admin_read
  on public.testimonials
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists testimonials_admin_insert on public.testimonials;
create policy testimonials_admin_insert
  on public.testimonials
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists testimonials_admin_update on public.testimonials;
create policy testimonials_admin_update
  on public.testimonials
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists testimonials_admin_delete on public.testimonials;
create policy testimonials_admin_delete
  on public.testimonials
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Seed from previous static home + service testimonials (idempotent)
-- -----------------------------------------------------------------------------

insert into public.testimonials (
  name, company, position, testimonial, rating, sort_order, status, featured,
  stat, stat_label, published_at
)
select *
from (
  values
    (
      'Sarah Mitchell'::text, 'NovaPay'::text, 'CTO'::text,
      'FlaireStack took the time to truly understand our needs and built custom solutions around our workflows. Transparent, reliable, and exceptional at every stage.'::text,
      5, 0, 'published'::public.content_status, true, '60+'::text, 'Projects Delivered'::text, now()
    ),
    (
      'James Okonkwo', 'ValidStack', 'Product Director',
      'The team''s dedication resulted in a seamless migration. Exceptional delivery and technical expertise that transformed our platform completely.',
      5, 1, 'published', true, '98%', 'Client Satisfaction', now()
    ),
    (
      'Elena Vasquez', 'Atlas Health', 'VP Engineering',
      'Expert engineers embedded in our workflow from day one. Production-grade quality, clear communication, and measurable ROI.',
      5, 2, 'published', true, '15+', 'Expert Engineers', now()
    ),
    (
      'David Chen', 'NovaPay Systems', 'CEO',
      'FlaireStack managed to deliver our platform on time with exceptional quality. Beta feedback from stakeholders and early users has been overwhelmingly positive.',
      5, 3, 'published', true, '60+', 'Projects Delivered', now()
    ),
    (
      'Michael Torres', 'CloudForge', 'Director of IT',
      'Our cloud migration was seamless. Their technical depth and proactive planning eliminated downtime risks and gave us a modern stack we can scale for years.',
      5, 4, 'published', false, '5+', 'Years Experience', now()
    ),
    (
      'Marcus Lee', 'Synapse AI', 'Head of Product',
      'We needed AI integrated into an existing enterprise product — not a science project. They shipped production-ready ML with monitoring our team could own.',
      5, 5, 'published', true, '98%', 'Client Satisfaction', now()
    ),
    (
      'Priya Sharma', 'Northline Finance', 'COO',
      'Security and compliance were non-negotiable for our fintech rollout. Their security-first SDLC and penetration testing gave our board confidence to go live on schedule.',
      5, 6, 'published', true, '15+', 'Expert Engineers', now()
    ),
    (
      'Alex Rivera', 'Pulse Mobility', 'Founder',
      'The mobile experience they built rivals apps from companies ten times our size. Performance, accessibility, and polish exceeded what we thought possible on our budget.',
      5, 7, 'published', true, '3', 'Countries Served', now()
    ),
    (
      'Hannah Brooks', 'Meridian Retail', 'Director of Data',
      'FlaireStack rebuilt our analytics dashboard from the ground up. Executives finally have real-time KPIs they trust, and our data team spends less time firefighting.',
      5, 8, 'published', true, '60+', 'Projects Delivered', now()
    ),
    (
      'Tom Andersson', 'ValidStack', 'Engineering Manager',
      'What stood out was accountability. When scope shifted, they re-estimated honestly, adjusted the roadmap, and still hit our launch window without cutting corners.',
      5, 9, 'published', true, '98%', 'Client Satisfaction', now()
    ),
    (
      'Nina Patel', 'Brightpath Education', 'VP Product',
      'From discovery through launch, every sprint had clear milestones and demos. The design-led approach helped us ship a product customers adopt faster than projected.',
      5, 10, 'published', false, '5+', 'Years Experience', now()
    ),
    (
      'Rachel Kim', 'Atlas Learning', 'CMO',
      'We have partnered with several agencies before. FlaireStack combined strategic thinking, beautiful UX, and engineering discipline — we are already planning phase two.',
      5, 11, 'published', true, '15+', 'Expert Engineers', now()
    ),
    (
      'Chris Dalton', 'Meridian Logistics', 'CTO',
      'Their DevOps and CI/CD setup cut our release cycles in half. We deploy with confidence now, and on-call incidents dropped significantly within the first quarter.',
      5, 12, 'published', false, '3', 'Countries Served', now()
    )
) as seed(
  name, company, position, testimonial, rating, sort_order, status, featured,
  stat, stat_label, published_at
)
where not exists (select 1 from public.testimonials limit 1);
