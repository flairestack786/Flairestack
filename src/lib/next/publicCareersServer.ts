import { cache } from 'react'
import { canonicalizeContentSlug } from '@/lib/contentSlug'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import { sanitizeCmsHtml } from '@/lib/sanitizeCmsHtml'

export type PublicJobCard = {
  id: string
  title: string
  slug: string
  department: string
  employmentType: string
  workArrangement: string
  location: string
  shortDescription: string
  publishedAt: string | null
  closingDate: string | null
}

export type PublicJobDetail = PublicJobCard & {
  descriptionHtml: string
  responsibilitiesHtml: string
  qualificationsHtml: string
  applicationInstructions: string
  applicationEmail: string | null
  applicationUrl: string | null
  updatedAt: string | null
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const ARRANGEMENT_LABELS: Record<string, string> = {
  on_site: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

export function labelEmploymentType(value: string) {
  return EMPLOYMENT_LABELS[value] ?? value
}

export function labelWorkArrangement(value: string) {
  return ARRANGEMENT_LABELS[value] ?? value
}

function mapCard(row: Record<string, unknown>): PublicJobCard {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    department: String(row.department ?? ''),
    employmentType: String(row.employment_type ?? ''),
    workArrangement: String(row.work_arrangement ?? ''),
    location: String(row.location ?? ''),
    shortDescription: String(row.short_description ?? ''),
    publishedAt: row.published_at ? String(row.published_at) : null,
    closingDate: row.closing_date ? String(row.closing_date) : null,
  }
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  if (error.code === 'PGRST205' || error.code === '42P01') return true
  return /could not find the table|relation .* does not exist/i.test(String(error.message ?? ''))
}

export const listActiveJobPostings = cache(async function listActiveJobPostings(): Promise<
  PublicJobCard[]
> {
  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      'id, title, slug, department, employment_type, work_arrangement, location, short_description, published_at, closing_date'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  const today = new Date().toISOString().slice(0, 10)
  return (data ?? [])
    .map((row) => mapCard(row as Record<string, unknown>))
    .filter((job) => !job.closingDate || job.closingDate >= today)
})

export const getActiveJobPostingBySlug = cache(async function getActiveJobPostingBySlug(
  slugInput: string
): Promise<PublicJobDetail | null> {
  const slug = canonicalizeContentSlug(slugInput)
  if (!slug) return null

  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }
  if (!data) return null

  const card = mapCard(data as Record<string, unknown>)
  const today = new Date().toISOString().slice(0, 10)
  if (card.closingDate && card.closingDate < today) return null

  return {
    ...card,
    descriptionHtml: sanitizeCmsHtml(String(data.description_html ?? '')),
    responsibilitiesHtml: sanitizeCmsHtml(String(data.responsibilities_html ?? '')),
    qualificationsHtml: sanitizeCmsHtml(String(data.qualifications_html ?? '')),
    applicationInstructions: String(data.application_instructions ?? ''),
    applicationEmail: data.application_email ? String(data.application_email) : null,
    applicationUrl: data.application_url ? String(data.application_url) : null,
    updatedAt: data.updated_at ? String(data.updated_at) : null,
  }
})
