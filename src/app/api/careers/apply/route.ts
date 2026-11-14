import { createHash, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { verifyTurnstileToken } from '../../../../../server/verifyTurnstile.js'
import {
  JOB_RESUME_MAX_BYTES,
  looksLikeResumeBytes,
  sanitizeProfileLinks,
  validateApplicationFields,
  validateResumeIdentity,
} from '@/lib/jobApplicationValidation'
import { sendApplicationConfirmationEmail } from '@/lib/next/sendApplicationConfirmationEmail'
import { getSupabaseServiceRole } from '@/lib/next/supabaseServiceRole'

export const runtime = 'nodejs'

const RESUME_BUCKET = 'job-resumes'

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const first = forwarded.split(',')[0]?.trim()
  return first || request.headers.get('x-real-ip') || ''
}

function hashIp(ip: string) {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

/**
 * Public job application submission.
 * Multipart form → validate → private resume upload → DB insert → confirmation email.
 */
export async function POST(request: Request) {
  let resumePath: string | null = null
  const supabase = getSupabaseServiceRole()

  try {
    const form = await request.formData()
    const jobSlug = String(form.get('job_slug') ?? '').trim().toLowerCase()
    const turnstileToken = String(form.get('turnstile_token') ?? '').trim()
    const profileLinksRaw = String(form.get('profile_links') ?? '[]')

    if (!jobSlug) return jsonError('Job is required.')

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (turnstileSiteKey) {
      if (!turnstileSecret) {
        return jsonError('Security verification is not configured on the server.', 500)
      }
      if (!turnstileToken) return jsonError('Please complete the security verification.')
      const verified = await verifyTurnstileToken(turnstileToken, turnstileSecret)
      if (!verified?.success) return jsonError('Security verification failed.', 403)
    }

    let profileLinksInput: unknown = []
    try {
      profileLinksInput = JSON.parse(profileLinksRaw)
    } catch {
      return jsonError('Professional profile links are invalid.')
    }
    const profileLinks = sanitizeProfileLinks(profileLinksInput)

    const fieldResult = validateApplicationFields({
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      email: form.get('email'),
      phone: form.get('phone'),
      current_job_title: form.get('current_job_title'),
      current_company: form.get('current_company'),
      location: form.get('location'),
      years_experience: form.get('years_experience'),
      notice_period: form.get('notice_period'),
      cover_letter: form.get('cover_letter'),
    })
    if (!fieldResult.ok) {
      return jsonError('Please fix the highlighted fields.', 400, { fieldErrors: fieldResult.errors })
    }

    const resume = form.get('resume')
    if (!(resume instanceof File) || resume.size <= 0) {
      return jsonError('Please upload your resume (PDF or DOCX, max 5 MB).')
    }
    if (resume.size > JOB_RESUME_MAX_BYTES) {
      return jsonError('Resume must be 5 MB or smaller.')
    }

    const identity = validateResumeIdentity(resume.name, resume.type)
    if (!identity.ok) return jsonError(identity.error)

    const bytes = new Uint8Array(await resume.arrayBuffer())
    if (!looksLikeResumeBytes(bytes, identity.ext)) {
      return jsonError('Resume file contents do not match a PDF or DOCX document.')
    }

    const today = new Date().toISOString().slice(0, 10)
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('id, title, slug, status, closing_date')
      .eq('slug', jobSlug)
      .eq('status', 'published')
      .maybeSingle()

    if (jobError) return jsonError('Unable to verify the job posting.', 500)
    if (!job) return jsonError('This job is not accepting applications.', 404)
    if (job.closing_date && String(job.closing_date) < today) {
      return jsonError('This job posting has closed.', 410)
    }

    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_posting_id', job.id)
      .ilike('email', fieldResult.data.email)
      .maybeSingle()

    if (existing) {
      return jsonError('You have already applied for this position with this email.', 409)
    }

    const objectName = `${job.id}/${randomUUID()}${identity.ext}`
    resumePath = objectName

    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(objectName, bytes, {
        contentType: identity.mime,
        upsert: false,
        cacheControl: 'private, max-age=0',
      })

    if (uploadError) {
      console.error('[careers/apply] resume upload failed', uploadError)
      return jsonError('Unable to upload your resume. Please try again.', 500)
    }

    const { data: application, error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_posting_id: job.id,
        ...fieldResult.data,
        profile_links: profileLinks,
        resume_storage_path: objectName,
        resume_original_filename: resume.name.slice(0, 240),
        resume_mime_type: identity.mime,
        resume_size: resume.size,
        application_status: 'new',
        source_ip_hash: hashIp(clientIp(request)),
        confirmation_email_status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !application) {
      console.error('[careers/apply] insert failed', insertError)
      await supabase.storage.from(RESUME_BUCKET).remove([objectName]).catch(() => null)
      resumePath = null

      if (insertError?.code === '23505') {
        return jsonError('You have already applied for this position with this email.', 409)
      }
      return jsonError('Unable to save your application. Please try again.', 500)
    }

    const emailResult = await sendApplicationConfirmationEmail({
      toEmail: fieldResult.data.email,
      firstName: fieldResult.data.first_name,
      jobTitle: String(job.title ?? 'Open Role'),
    })

    if (emailResult.ok) {
      await supabase
        .from('job_applications')
        .update({ confirmation_email_status: 'sent', confirmation_email_error: '' })
        .eq('id', application.id)
    } else {
      console.error('[careers/apply] confirmation email failed', emailResult.error)
      await supabase
        .from('job_applications')
        .update({
          confirmation_email_status: emailResult.skipped ? 'skipped' : 'failed',
          confirmation_email_error: emailResult.error.slice(0, 500),
        })
        .eq('id', application.id)
    }

    return NextResponse.json({
      ok: true,
      jobTitle: job.title,
      jobSlug: job.slug,
      emailQueued: emailResult.ok,
    })
  } catch (error) {
    console.error('[careers/apply] unexpected failure', error)
    if (resumePath) {
      try {
        await getSupabaseServiceRole().storage.from(RESUME_BUCKET).remove([resumePath])
      } catch {
        // ignore cleanup failure
      }
    }
    return jsonError('Something went wrong while submitting your application.', 500)
  }
}
