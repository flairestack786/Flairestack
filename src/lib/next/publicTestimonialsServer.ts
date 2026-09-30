import { cache } from 'react'
import { homeTestimonials } from '@/data/homeTestimonials'
import { serviceTestimonials } from '@/data/serviceTestimonials'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'

function initialsFromName(name: string): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export type PublicTestimonial = {
  id: string
  quote: string
  author: string
  role: string
  initials: string
  photoUrl: string | null
  stat: string
  statLabel: string
}

const FALLBACK_HOME: PublicTestimonial[] = homeTestimonials.map((item, index) => ({
  id: `home-fallback-${index}`,
  quote: item.quote,
  author: item.author,
  role: item.role,
  initials: item.initials,
  photoUrl: null,
  stat: '',
  statLabel: '',
}))

const FALLBACK_SERVICE: PublicTestimonial[] = serviceTestimonials.map((item, index) => ({
  id: `service-fallback-${index}`,
  quote: item.quote,
  author: item.author,
  role: item.role,
  initials: initialsFromName(item.author),
  photoUrl: null,
  stat: item.stat,
  statLabel: item.statLabel,
}))

/**
 * Shared published testimonials fetch (Home + Services).
 * Filter: status=published. Order: sort_order asc.
 * `featured` / `company_logo_path` / `rating` are unused by public UI (Vite parity).
 */
export const getPublishedPublicTestimonials = cache(
  async (): Promise<PublicTestimonial[]> => {
    try {
      const supabase = getSupabasePublicServer()
      const { data, error } = await supabase
        .from('testimonials')
        .select(
          'id, name, company, position, testimonial, photo_path, sort_order, featured, stat, stat_label'
        )
        .eq('status', 'published')
        .order('sort_order', { ascending: true })

      if (error) throw error
      if (!data?.length) return []

      return data
        .map((row) => {
          const name = String(row.name ?? '').trim()
          const company = String(row.company ?? '').trim()
          const position = String(row.position ?? '').trim()
          const photoPath = String(row.photo_path ?? '').trim()
          return {
            id: String(row.id ?? name),
            quote: String(row.testimonial ?? '').trim(),
            author: name,
            role: [position, company].filter(Boolean).join(', '),
            initials: initialsFromName(name),
            photoUrl: photoPath ? getPublicMediaUrl(photoPath) : null,
            stat: String(row.stat ?? '').trim(),
            statLabel: String(row.stat_label ?? '').trim(),
          }
        })
        .filter((item) => item.quote && item.author)
    } catch {
      return []
    }
  }
)

/** Home placement — falls back to static homeTestimonials. */
export const getHomeTestimonialsShared = cache(async (): Promise<PublicTestimonial[]> => {
  const rows = await getPublishedPublicTestimonials()
  if (rows.length === 0) return FALLBACK_HOME
  return rows
})

/** Service placement — same pool + default stats (Vite serviceTestimonials memo). */
export const getServiceTestimonialsShared = cache(async (): Promise<PublicTestimonial[]> => {
  const rows = await getPublishedPublicTestimonials()
  if (rows.length === 0) return FALLBACK_SERVICE
  return rows.map((item) => ({
    ...item,
    stat: item.stat || '—',
    statLabel: item.statLabel || 'Impact',
  }))
})

export { FALLBACK_HOME as FALLBACK_HOME_TESTIMONIALS_SHARED }
