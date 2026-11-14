'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import { isJobApplicationStatus } from '@/lib/jobApplicationValidation'

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

export async function listJobApplications(): Promise<JobApplicationRow[]> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('job_applications')
    .select(LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as JobApplicationRow[]
}

export async function getJobApplication(id: string): Promise<JobApplicationRow> {
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

export async function createResumeDownloadUrl(applicationId: string): Promise<string> {
  const supabase = getSupabaseBrowser()
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('You must be signed in as an administrator.')

  const response = await fetch(`/api/admin/careers/applications/${applicationId}/resume`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Unable to create resume download link.')
  }
  return payload.url
}
