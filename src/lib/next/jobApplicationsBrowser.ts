'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import { isJobApplicationStatus } from '@/lib/jobApplicationValidation'
import {
  fetchJobApplicants,
  fetchJobSummaries,
  fetchJobSummary,
} from '@/lib/applicantsQueries'
import type { JobSummary } from '@/lib/applicantsCms'
import { isUuid } from '@/lib/hiringNotificationEmail'
import {
  RESUME_FETCH_TIMEOUT_MS,
  ResumeAccessError,
  resumeError,
  runResumeAction,
  type ResumeLink,
} from '@/lib/resumeClient'

export type JobApplicationRow = {
  id: string
  job_posting_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  current_job_title?: string | null
  current_company?: string | null
  location?: string | null
  years_experience?: string | null
  notice_period?: string | null
  cover_letter?: string | null
  profile_links?: unknown
  resume_original_filename?: string | null
  resume_mime_type?: string | null
  resume_size?: number | null
  application_status: string
  internal_notes?: string | null
  confirmation_email_status?: string | null
  confirmation_email_error?: string | null
  created_at?: string | null
  updated_at?: string | null
  job_postings?: {
    id?: string
    title?: string | null
    slug?: string | null
    department?: string | null
    status?: string | null
  } | null
}

const LIST_SELECT = `
  id,
  job_posting_id,
  first_name,
  last_name,
  email,
  phone,
  current_job_title,
  current_company,
  location,
  years_experience,
  notice_period,
  cover_letter,
  profile_links,
  resume_original_filename,
  resume_mime_type,
  resume_size,
  application_status,
  internal_notes,
  confirmation_email_status,
  confirmation_email_error,
  created_at,
  updated_at,
  job_postings (
    id,
    title,
    slug,
    department,
    status
  )
`

export type ApplicantListRow = {
  id: string
  job_posting_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  application_status: string
  created_at?: string | null
  resume_original_filename?: string | null
  resume_mime_type?: string | null
  resume_size?: number | null
}

export type JobApplicantsPage = {
  rows: ApplicantListRow[]
  total: number
  page: number
  pageSize: number
}

/** Every job posting with real applicant counts (one request, no per-row queries). */
export async function listJobSummaries(): Promise<JobSummary[]> {
  return fetchJobSummaries(getSupabaseBrowser()) as Promise<JobSummary[]>
}

export async function getJobSummary(jobId: string): Promise<JobSummary | null> {
  return fetchJobSummary(getSupabaseBrowser(), jobId) as Promise<JobSummary | null>
}

export async function listJobApplicants(
  jobId: string,
  options: {
    search?: string
    status?: string
    sort?: 'newest' | 'oldest'
    page?: number
  }
): Promise<JobApplicantsPage> {
  return fetchJobApplicants(getSupabaseBrowser(), jobId, options) as Promise<JobApplicantsPage>
}

/**
 * Best-effort: reads columns added by the optional notification-status migration.
 * Returns null when they don't exist yet so the page still works before it's applied.
 */
export async function getHiringNotificationStatus(
  id: string
): Promise<{ status: string; error: string } | null> {
  const { data, error } = await getSupabaseBrowser()
    .from('job_applications')
    .select('hiring_notification_status, hiring_notification_error')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return {
    status: String(data.hiring_notification_status ?? 'not_sent'),
    error: String(data.hiring_notification_error ?? ''),
  }
}

export async function getJobApplication(id: string): Promise<JobApplicationRow> {
  if (!isUuid(id)) throw new Error('Invalid application id.')
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('job_applications')
    .select(LIST_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as JobApplicationRow
}

export async function updateJobApplication(
  id: string,
  fields: { application_status?: string; internal_notes?: string }
): Promise<JobApplicationRow> {
  if (!isUuid(id)) throw new Error('Invalid application id.')
  const payload: Record<string, unknown> = {}
  if (fields.application_status != null) {
    if (!isJobApplicationStatus(fields.application_status)) {
      throw new Error('Invalid application status.')
    }
    payload.application_status = fields.application_status
  }
  if (fields.internal_notes != null) {
    payload.internal_notes = String(fields.internal_notes)
  }

  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('job_applications')
    .update(payload)
    .eq('id', id)
    .select(LIST_SELECT)
    .single()

  if (error) throw error
  return data as JobApplicationRow
}

/**
 * View or download a resume (see `resumeClient.js` for the full flow).
 * Call directly from a click handler: the "view" tab must be opened before any await.
 */
export async function openResume(
  applicationId: string,
  mode: 'view' | 'download',
  options: { mimeType?: string | null } = {}
): Promise<{ action: 'viewed' | 'downloaded'; previewUnavailable: boolean }> {
  return runResumeAction(
    {
      openTab() {
        const tab = window.open('', '_blank')
        if (!tab) return null
        tab.opener = null
        renderResumePlaceholder(tab)
        return {
          // Only ever called with a same-origin blob: URL (see resumeClient.js).
          navigate: (url: string) => tab.location.replace(url),
          close: () => tab.close(),
        }
      },
      requestLink: (requested) => requestResumeLink(applicationId, requested),
      fetchFile: (url, signal) =>
        fetch(url, {
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal,
        }),
      createObjectUrl: (blob) => URL.createObjectURL(blob),
      revokeObjectUrl: (url) => URL.revokeObjectURL(url),
      saveFile(href, filename) {
        // Last line of defence: only a same-origin blob: URL may ever back a download link.
        if (!href.startsWith('blob:')) throw resumeError('failed')
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = filename
        anchor.rel = 'noopener noreferrer'
        anchor.style.display = 'none'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      },
      schedule: (fn, ms) => void window.setTimeout(fn, ms),
    },
    { mode, mimeType: options.mimeType }
  )
}

/**
 * Mint a fresh short-lived signed link (never cached or stored) through the administrator-only API route.
 * `view` → inline link for PDFs; `download` → attachment link with the original filename.
 */
async function requestResumeLink(
  applicationId: string,
  mode: 'view' | 'download'
): Promise<ResumeLink> {
  if (!isUuid(applicationId)) throw new ResumeAccessError('Invalid application id.', { kind: 'failed' })

  const supabase = getSupabaseBrowser()
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    throw new ResumeAccessError('You must be signed in as an administrator.', {
      kind: 'unauthorized',
    })
  }

  // Same hard limit as the file fetch, so a stalled request can't leave the buttons busy.
  const controller = new AbortController()
  let timedOut = false
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, RESUME_FETCH_TIMEOUT_MS)

  try {
    let response: Response
    try {
      response = await fetch(
        `/api/admin/careers/applications/${encodeURIComponent(applicationId)}/resume?mode=${mode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        }
      )
    } catch {
      throw resumeError(timedOut ? 'timeout' : 'network')
    }

    let payload: Partial<ResumeLink> & { error?: string }
    try {
      payload = (await response.json()) as typeof payload
    } catch {
      if (timedOut) throw resumeError('timeout')
      payload = {}
    }

    if (response.status === 401 || response.status === 403) throw resumeError('unauthorized')
    if (response.status === 404) throw resumeError('not_found')
    if (!response.ok || !payload.url) throw resumeError('failed')
    return toResumeLink(payload as ResumeLink & { url: string })
  } finally {
    window.clearTimeout(timer)
  }
}

/** Dark, on-brand placeholder shown in the View tab while the PDF is being fetched. */
function renderResumePlaceholder(tab: Window) {
  try {
    const doc = tab.document
    doc.title = 'Opening resume…'
    const style = doc.createElement('style')
    style.textContent =
      'html,body{margin:0;height:100%;background:#0a0a0a;color:rgba(255,255,255,.72);' +
      'font:500 14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      'main{min-height:100%;display:grid;place-content:center;justify-items:center;gap:.9rem;padding:2rem;text-align:center}' +
      '.s{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.14);' +
      'border-top-color:#ff7a00;animation:r .85s linear infinite}' +
      'h1{margin:0;font-size:1rem;font-weight:600;color:#fff}p{margin:0;font-size:.8125rem;color:rgba(255,255,255,.55)}' +
      '@keyframes r{to{transform:rotate(360deg)}}' +
      '@media (prefers-reduced-motion:reduce){.s{animation-duration:3s}}'
    const main = doc.createElement('main')
    main.setAttribute('role', 'status')
    main.setAttribute('aria-live', 'polite')
    const spinner = doc.createElement('div')
    spinner.className = 's'
    const heading = doc.createElement('h1')
    heading.textContent = 'Opening resume…'
    const hint = doc.createElement('p')
    hint.textContent = 'The document will appear here in a moment.'
    main.append(spinner, heading, hint)
    doc.head.append(style)
    doc.body.replaceChildren(main)
  } catch {
    // Cosmetic only; the flow works with a blank tab.
  }
}

function toResumeLink(payload: ResumeLink & { url: string }): ResumeLink {
  return {
    url: payload.url,
    filename: payload.filename || 'resume',
    mimeType: payload.mimeType || 'application/octet-stream',
    inline: Boolean(payload.inline),
    previewable: Boolean(payload.previewable),
  }
}
