/**
 * Supabase queries for the Applicants CMS. They take a client so the same code runs
 * in the browser (admin JWT + RLS `is_admin()`) and in tests (real supabase-js with a
 * fake fetch). No query is issued per row.
 */

import {
  APPLICANTS_PAGE_SIZE,
  applicantStatusFilter,
  clampPage,
  normalizeJobSummary,
  searchTokens,
} from './applicantsCms.js'
import { isUuid } from './hiringNotificationEmail.js'

/**
 * One request returns every job with its counts:
 *  - total:     all applications for the job
 *  - new_count: applications with status = new (filter applied on the alias)
 *  - last:      newest application timestamp (ordered desc, limit 1 on the alias)
 * Jobs with zero applications are kept (embedded counts are LEFT-style, not inner).
 */
export const JOB_SUMMARY_SELECT = [
  'id',
  'title',
  'slug',
  'department',
  'employment_type',
  'location',
  'status',
  'created_at',
  'total:job_applications(count)',
  'new_count:job_applications(count)',
  'last:job_applications(created_at)',
].join(',')

/** List view: no cover letter or internal notes. */
export const APPLICANT_LIST_SELECT = [
  'id',
  'job_posting_id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'application_status',
  'created_at',
  'resume_original_filename',
  'resume_mime_type',
  'resume_size',
].join(',')

/** @param {any} query */
function withSummaryModifiers(query) {
  return query
    .eq('new_count.application_status', 'new')
    .order('created_at', { referencedTable: 'last', ascending: false })
    .limit(1, { referencedTable: 'last' })
}

/**
 * Every job posting (any status) with applicant counts.
 * @param {any} supabase
 */
export async function fetchJobSummaries(supabase) {
  const { data, error } = await withSummaryModifiers(
    supabase.from('job_postings').select(JOB_SUMMARY_SELECT)
  ).order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeJobSummary)
}

/**
 * @param {any} supabase
 * @param {string} jobId
 */
export async function fetchJobSummary(supabase, jobId) {
  if (!isUuid(jobId)) throw new Error('Invalid job id.')
  const { data, error } = await withSummaryModifiers(
    supabase.from('job_postings').select(JOB_SUMMARY_SELECT).eq('id', jobId)
  ).maybeSingle()

  if (error) throw error
  return data ? normalizeJobSummary(data) : null
}

/**
 * Paginated applicants of ONE job. Each search token must match first name, last
 * name or email (tokens are AND-ed), so "jane doe" finds Jane Doe.
 * @param {any} supabase
 * @param {string} jobId
 * @param {{ search?: string, status?: string, sort?: 'newest' | 'oldest', page?: number, pageSize?: number }} [options]
 */
export async function fetchJobApplicants(supabase, jobId, options = {}) {
  if (!isUuid(jobId)) throw new Error('Invalid job id.')

  const pageSize = options.pageSize ?? APPLICANTS_PAGE_SIZE
  const page = Math.max(1, Math.floor(Number(options.page) || 1))
  const from = (page - 1) * pageSize

  let query = supabase
    .from('job_applications')
    .select(APPLICANT_LIST_SELECT, { count: 'exact' })
    .eq('job_posting_id', jobId)

  const status = applicantStatusFilter(options.status)
  if (status) query = query.eq('application_status', status)

  for (const token of searchTokens(options.search)) {
    query = query.or(
      `first_name.ilike.%${token}%,last_name.ilike.%${token}%,email.ilike.%${token}%`
    )
  }

  query = query
    .order('created_at', { ascending: options.sort === 'oldest' })
    // Deterministic order for identical timestamps so pages never overlap.
    .order('id', { ascending: true })
    .range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) {
    // Requested page is past the last one (a filter narrowed the results): show page 1.
    if (error.code === 'PGRST103' && page > 1) {
      return fetchJobApplicants(supabase, jobId, { ...options, page: 1 })
    }
    throw error
  }

  const total = count ?? (data ?? []).length
  return { rows: data ?? [], total, page: clampPage(page, total, pageSize), pageSize }
}
