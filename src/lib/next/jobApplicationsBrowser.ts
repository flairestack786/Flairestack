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
 * View or download a resume. The signed URL is minted server-side after admin
 * authorization and lives 60 seconds; it is never stored or rendered into the page.
 * For "view" the tab is opened synchronously (inside the click) so popup blockers
 * allow it, then pointed at the URL once it arrives.
 */
export async function openResume(applicationId: string, mode: 'view' | 'download'): Promise<void> {
  const tab = mode === 'view' ? window.open('', '_blank') : null
  if (tab) tab.opener = null
  try {
    const { url, inline } = await createResumeDownloadUrl(applicationId, mode)
    if (mode === 'view' && tab) {
      tab.location.href = url
      // DOCX can't render in a tab: the URL is a download, so the blank tab is spare.
      if (!inline) window.setTimeout(() => tab.close(), 1500)
      return
    }
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } catch (err) {
    tab?.close()
    throw err
  }
}

/**
 * Mint a 60-second signed URL through the administrator-only API route.
 * `view` opens PDFs inline (DOCX is always a download); `download` forces a download.
 */
export async function createResumeDownloadUrl(
  applicationId: string,
  mode: 'view' | 'download' = 'download'
): Promise<{ url: string; filename: string; inline: boolean }> {
  const supabase = getSupabaseBrowser()
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('You must be signed in as an administrator.')

  const disposition = mode === 'view' ? 'inline' : 'attachment'
  const response = await fetch(
    `/api/admin/careers/applications/${encodeURIComponent(applicationId)}/resume?disposition=${disposition}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  )
  const payload = (await response.json().catch(() => ({}))) as {
    url?: string
    filename?: string
    inline?: boolean
    error?: string
  }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Unable to create resume download link.')
  }
  return {
    url: payload.url,
    filename: payload.filename || 'resume',
    inline: Boolean(payload.inline),
  }
}
