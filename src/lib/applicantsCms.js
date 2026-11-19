/**
 * Pure helpers for the Applicants CMS (no I/O, unit-testable).
 */

import {
  JOB_APPLICATION_STATUSES,
  JOB_PROFILE_LINK_LABELS,
  isValidHttpsUrl,
} from './jobApplicationValidation.js'

export const APPLICANTS_PAGE_SIZE = 20

export const EMPLOYMENT_TYPE_LABELS = Object.freeze({
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
})

export const JOB_STATUS_LABELS = Object.freeze({
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
})

export const JOB_OVERVIEW_SORTS = Object.freeze([
  { value: 'recent', label: 'Most recent application' },
  { value: 'count_desc', label: 'Most applicants' },
  { value: 'count_asc', label: 'Fewest applicants' },
  { value: 'title', label: 'Job title (A–Z)' },
])

export const APPLICANT_SORTS = Object.freeze([
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
])

/** @param {unknown} value */
export function labelEmploymentType(value) {
  const key = String(value ?? '')
  return EMPLOYMENT_TYPE_LABELS[key] || (key ? key : '—')
}

/**
 * PostgREST returns embedded counts as `[{ count: n }]`.
 * @param {unknown} embed
 */
export function readEmbeddedCount(embed) {
  if (!Array.isArray(embed) || embed.length === 0) return 0
  const n = Number(embed[0]?.count)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   slug: string,
 *   employmentType: string,
 *   location: string,
 *   jobStatus: string,
 *   department: string,
 *   totalApplicants: number,
 *   newApplicants: number,
 *   lastApplicationAt: string | null,
 * }} JobSummary
 */

/**
 * Normalise one `job_postings` row (with aliased embeds) into a JobSummary.
 * @param {any} row
 * @returns {JobSummary}
 */
export function normalizeJobSummary(row) {
  const last = Array.isArray(row?.last) && row.last[0]?.created_at ? String(row.last[0].created_at) : null
  const total = readEmbeddedCount(row?.total)
  return {
    id: String(row?.id ?? ''),
    title: String(row?.title ?? '') || 'Untitled role',
    slug: String(row?.slug ?? ''),
    employmentType: String(row?.employment_type ?? ''),
    location: String(row?.location ?? ''),
    jobStatus: String(row?.status ?? ''),
    department: String(row?.department ?? ''),
    totalApplicants: total,
    // "new" can never exceed the total; guards against a transient read skew.
    newApplicants: Math.min(readEmbeddedCount(row?.new_count), total),
    lastApplicationAt: total > 0 ? last : null,
  }
}

/** @param {unknown} value */
function timeOf(value) {
  const t = value ? new Date(String(value)).getTime() : NaN
  return Number.isNaN(t) ? null : t
}

/**
 * @param {JobSummary[]} jobs
 * @param {{ query?: string, employmentType?: string, jobStatus?: string }} filters
 */
export function filterJobSummaries(jobs, filters = {}) {
  const q = String(filters.query ?? '').trim().toLowerCase()
  const type = filters.employmentType && filters.employmentType !== 'all' ? filters.employmentType : ''
  const status = filters.jobStatus && filters.jobStatus !== 'all' ? filters.jobStatus : ''
  return jobs.filter((job) => {
    if (type && job.employmentType !== type) return false
    if (status && job.jobStatus !== status) return false
    if (q && !job.title.toLowerCase().includes(q)) return false
    return true
  })
}

/**
 * Stable sort; jobs without applications always sink below jobs with them for
 * "recent", ties broken by title.
 * @param {JobSummary[]} jobs
 * @param {string} sort
 */
export function sortJobSummaries(jobs, sort = 'recent') {
  const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  const copy = [...jobs]
  copy.sort((a, b) => {
    if (sort === 'count_desc') return b.totalApplicants - a.totalApplicants || byTitle(a, b)
    if (sort === 'count_asc') return a.totalApplicants - b.totalApplicants || byTitle(a, b)
    if (sort === 'title') return byTitle(a, b)
    const ta = timeOf(a.lastApplicationAt)
    const tb = timeOf(b.lastApplicationAt)
    if (ta == null && tb == null) return byTitle(a, b)
    if (ta == null) return 1
    if (tb == null) return -1
    return tb - ta || byTitle(a, b)
  })
  return copy
}

/**
 * Make a free-text search term safe to embed in a PostgREST `or()` filter and an
 * ILIKE pattern: strip filter-syntax and wildcard characters, collapse whitespace,
 * cap length. Returns whitespace-separated tokens (AND-ed by the query builder).
 * @param {unknown} input
 * @returns {string[]}
 */
export function searchTokens(input) {
  const cleaned = String(input ?? '')
    .replace(/[\\%_*,()."'`:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return cleaned ? cleaned.split(' ').slice(0, 5) : []
}

/** @param {unknown} status */
export function applicantStatusFilter(status) {
  const value = String(status ?? '')
  return JOB_APPLICATION_STATUSES.includes(value) ? value : null
}

/** @param {unknown} status */
export function applicantBadgeClass(status) {
  const value = JOB_APPLICATION_STATUSES.includes(String(status)) ? String(status) : 'new'
  return `admin-leads-badge admin-leads-badge--status-${value}`
}

/**
 * Clickable professional links: only absolute https URLs survive, labelled by
 * platform. Anything else (javascript:, data:, http:, malformed) is dropped.
 * @param {unknown} raw
 * @returns {{ key: string, label: string, url: string }[]}
 */
export function readProfileLinks(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const link = /** @type {{ platform?: unknown, url?: unknown, label?: unknown }} */ (item)
    const url = String(link.url ?? '').trim()
    if (!isValidHttpsUrl(url)) return
    const platform = String(link.platform ?? 'other').toLowerCase()
    const custom = String(link.label ?? '').trim()
    const label =
      platform === 'other' && custom
        ? custom
        : JOB_PROFILE_LINK_LABELS[platform] || JOB_PROFILE_LINK_LABELS.other
    out.push({ key: `${platform}-${index}`, label, url })
  })
  return out
}

/** @param {unknown} mime */
export function resumeTypeLabel(mime) {
  const value = String(mime ?? '')
  if (value === 'application/pdf') return 'PDF'
  if (value === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'DOCX'
  }
  return 'Document'
}

/** @param {unknown} bytes */
export function resumeSizeLabel(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * @param {unknown} total
 * @param {number} [pageSize]
 */
export function pageCount(total, pageSize = APPLICANTS_PAGE_SIZE) {
  const n = Number(total)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.max(1, Math.ceil(n / pageSize))
}

/** @param {unknown} page */
export function clampPage(page, total, pageSize = APPLICANTS_PAGE_SIZE) {
  const n = Math.floor(Number(page))
  const max = pageCount(total, pageSize)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, max)
}
