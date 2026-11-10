'use client'

import { assertValidContentSlug, canonicalizeContentSlug } from '@/lib/contentSlug'
import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

export type JobEmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type JobWorkArrangement = 'on_site' | 'hybrid' | 'remote'
export type JobPostingStatus = 'draft' | 'published' | 'closed'

const WRITABLE_FIELDS = [
  'title',
  'slug',
  'department',
  'employment_type',
  'work_arrangement',
  'location',
  'short_description',
  'description_html',
  'responsibilities_html',
  'qualifications_html',
  'application_instructions',
  'application_email',
  'application_url',
  'published_at',
  'closing_date',
] as const

const EMPLOYMENT_TYPES = new Set(['full_time', 'part_time', 'contract', 'internship'])
const WORK_ARRANGEMENTS = new Set(['on_site', 'hybrid', 'remote'])

function sanitizePayload(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    WRITABLE_FIELDS.filter((key) => fields[key] !== undefined).map((key) => {
      const value = fields[key]
      if (key === 'slug') {
        return [key, assertValidContentSlug(value)]
      }
      if (key === 'employment_type') {
        const next = String(value ?? 'full_time')
        return [key, EMPLOYMENT_TYPES.has(next) ? next : 'full_time']
      }
      if (key === 'work_arrangement') {
        const next = String(value ?? 'remote')
        return [key, WORK_ARRANGEMENTS.has(next) ? next : 'remote']
      }
      if (key === 'published_at' || key === 'closing_date') {
        return [key, value || null]
      }
      if (
        typeof value === 'string' &&
        (key === 'application_email' || key === 'application_url')
      ) {
        return [key, value.trim() === '' ? null : value.trim()]
      }
      if (typeof value === 'string') {
        return [key, value.trim()]
      }
      return [key, value]
    })
  )
}

function uniqueSlugCandidate(base: string, suffix = 0) {
  const root = canonicalizeContentSlug(base) || 'role'
  return suffix > 0 ? `${root}-${suffix}` : root
}

export async function listJobPostings(): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      'id, title, slug, department, employment_type, work_arrangement, location, status, published_at, closing_date, updated_at, short_description'
    )
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getJobPosting(id: string): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.from('job_postings').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createJobPosting(
  input: Partial<Record<string, unknown>> = {}
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const title = String(input.title ?? 'New role').trim() || 'New role'
  let slug = canonicalizeContentSlug(input.slug ?? title) || 'new-role'

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = uniqueSlugCandidate(slug, attempt)
    const payload = {
      ...sanitizePayload({
        title,
        slug: candidate,
        department: input.department ?? '',
        employment_type: input.employment_type ?? 'full_time',
        work_arrangement: input.work_arrangement ?? 'remote',
        location: input.location ?? '',
        short_description: input.short_description ?? '',
        description_html: input.description_html ?? '',
        responsibilities_html: input.responsibilities_html ?? '',
        qualifications_html: input.qualifications_html ?? '',
        application_instructions: input.application_instructions ?? '',
        application_email: input.application_email ?? null,
        application_url: input.application_url ?? null,
        closing_date: input.closing_date ?? null,
      }),
      status: 'draft',
      published_at: null,
    }

    const { data, error } = await supabase.from('job_postings').insert(payload).select().single()
    if (!error) return data
    if (!String(error.message ?? '').toLowerCase().includes('duplicate')) throw error
    slug = candidate
  }

  throw new Error('Could not allocate a unique job slug. Try a different title.')
}

export async function updateJobPosting(
  id: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const payload = sanitizePayload(fields)
  delete (payload as { status?: unknown }).status
  delete payload.published_at

  const { data, error } = await supabase
    .from('job_postings')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Job posting not found or you do not have permission to update it.')
  return data
}

export async function setJobPostingStatus(
  id: string,
  status: JobPostingStatus
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const clean =
    status === 'published'
      ? { status, published_at: new Date().toISOString() }
      : status === 'draft'
        ? { status: 'draft' as const, published_at: null }
        : { status: 'closed' as const }

  const { data, error } = await supabase
    .from('job_postings')
    .update(clean)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Job posting not found or you do not have permission to update it.')
  return data
}

export async function deleteJobPosting(id: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('job_postings').delete().eq('id', id)
  if (error) throw error
}
