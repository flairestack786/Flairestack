'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { JOB_PROFILE_LINK_TYPES, JOB_RESUME_MAX_BYTES } from '@/lib/jobApplicationValidation'
import { publicCareerPath } from '@/lib/contentSlug'

type ProfileLink = { platform: string; url: string }

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  website: 'Personal website',
  portfolio: 'Portfolio',
  behance: 'Behance',
  dribbble: 'Dribbble',
  other: 'Other',
}

type JobApplicationFormProps = {
  job: {
    id: string
    title: string
    slug: string
    department: string
  }
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function JobApplicationForm({ job }: JobApplicationFormProps) {
  const router = useRouter()
  const turnstileRef = useRef<{ reset: () => void } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [resume, setResume] = useState<File | null>(null)
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([])
  const [values, setValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_job_title: '',
    current_company: '',
    location: '',
    years_experience: '',
    notice_period: '',
    cover_letter: '',
  })

  const acceptHint = useMemo(
    () => `PDF or DOCX · max ${Math.round(JOB_RESUME_MAX_BYTES / (1024 * 1024))} MB`,
    []
  )

  const update =
    (key: keyof typeof values) =>
    (event: { target: { value: string } }) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }))
      setFieldErrors((prev) => ({ ...prev, [key]: '' }))
      setSubmitError('')
    }

  const resetTurnstile = () => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  const onResumeChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null
    setResume(file)
    setFieldErrors((prev) => ({ ...prev, resume: '' }))
    setSubmitError('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setSubmitError('')
    setFieldErrors({})

    try {
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error('Please complete the security verification before submitting.')
      }
      if (!resume) {
        setFieldErrors({ resume: 'Please upload your resume.' })
        throw new Error('Please upload your resume.')
      }

      const form = new FormData()
      form.set('job_slug', job.slug)
      Object.entries(values).forEach(([key, value]) => form.set(key, value))
      form.set('profile_links', JSON.stringify(profileLinks))
      form.set('resume', resume)
      if (turnstileToken) form.set('turnstile_token', turnstileToken)

      const response = await fetch('/api/careers/apply', {
        method: 'POST',
        body: form,
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        fieldErrors?: Record<string, string>
        jobTitle?: string
        jobSlug?: string
      }

      if (!response.ok) {
        if (payload.fieldErrors) setFieldErrors(payload.fieldErrors)
        throw new Error(payload.error || 'Unable to submit your application.')
      }

      const params = new URLSearchParams({
        job: payload.jobTitle || job.title,
        slug: payload.jobSlug || job.slug,
      })
      router.push(`/careers/application-submitted?${params.toString()}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong.')
      resetTurnstile()
      setSubmitting(false)
    }
  }

  return (
    <form className="job-apply-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <div className="job-apply-grid">
        <label className="job-apply-field">
          <span>First name *</span>
          <input
            className="admin-settings-input"
            value={values.first_name}
            onChange={update('first_name')}
            autoComplete="given-name"
            required
          />
          {fieldErrors.first_name ? <em>{fieldErrors.first_name}</em> : null}
        </label>
        <label className="job-apply-field">
          <span>Last name *</span>
          <input
            className="admin-settings-input"
            value={values.last_name}
            onChange={update('last_name')}
            autoComplete="family-name"
            required
          />
          {fieldErrors.last_name ? <em>{fieldErrors.last_name}</em> : null}
        </label>
        <label className="job-apply-field">
          <span>Email *</span>
          <input
            className="admin-settings-input"
            type="email"
            value={values.email}
            onChange={update('email')}
            autoComplete="email"
            required
          />
          {fieldErrors.email ? <em>{fieldErrors.email}</em> : null}
        </label>
        <label className="job-apply-field">
          <span>Phone *</span>
          <input
            className="admin-settings-input"
            type="tel"
            value={values.phone}
            onChange={update('phone')}
            autoComplete="tel"
            required
          />
          {fieldErrors.phone ? <em>{fieldErrors.phone}</em> : null}
        </label>
        <label className="job-apply-field">
          <span>Professional headline / current title</span>
          <input
            className="admin-settings-input"
            value={values.current_job_title}
            onChange={update('current_job_title')}
          />
        </label>
        <label className="job-apply-field">
          <span>Current company</span>
          <input
            className="admin-settings-input"
            value={values.current_company}
            onChange={update('current_company')}
          />
        </label>
        <label className="job-apply-field">
          <span>Location</span>
          <input
            className="admin-settings-input"
            value={values.location}
            onChange={update('location')}
            autoComplete="address-level2"
          />
        </label>
        <label className="job-apply-field">
          <span>Years of professional experience</span>
          <input
            className="admin-settings-input"
            value={values.years_experience}
            onChange={update('years_experience')}
            placeholder="e.g. 5"
          />
        </label>
        <label className="job-apply-field job-apply-field--full">
          <span>Notice period / availability</span>
          <input
            className="admin-settings-input"
            value={values.notice_period}
            onChange={update('notice_period')}
            placeholder="e.g. 2 weeks, immediately available"
          />
        </label>
        <label className="job-apply-field job-apply-field--full">
          <span>Cover letter / additional message</span>
          <textarea
            className="admin-settings-textarea"
            rows={6}
            value={values.cover_letter}
            onChange={update('cover_letter')}
          />
        </label>
      </div>

      <section className="job-apply-section">
        <h2>Resume / CV *</h2>
        <p className="job-apply-hint">{acceptHint}</p>
        <label className="job-apply-upload">
          <Upload size={18} strokeWidth={1.75} aria-hidden />
          <span>{resume ? 'Replace resume' : 'Choose resume file'}</span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => onResumeChange(e.target.files)}
          />
        </label>
        {resume ? (
          <div className="job-apply-file">
            <div>
              <strong>{resume.name}</strong>
              <span>{formatBytes(resume.size)}</span>
            </div>
            <button type="button" onClick={() => setResume(null)}>
              Remove
            </button>
          </div>
        ) : null}
        {fieldErrors.resume ? <em className="job-apply-error">{fieldErrors.resume}</em> : null}
      </section>

      <section className="job-apply-section">
        <div className="job-apply-section-head">
          <div>
            <h2>Professional Profiles &amp; Links</h2>
            <p className="job-apply-hint">Optional. Add LinkedIn, GitHub, portfolio, or other HTTPS links.</p>
          </div>
          <button
            type="button"
            className="job-apply-add-link"
            onClick={() =>
              setProfileLinks((prev) =>
                prev.length >= 8 ? prev : [...prev, { platform: 'linkedin', url: '' }]
              )
            }
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Add Another Link
          </button>
        </div>

        {profileLinks.map((link, index) => (
          <div key={`link-${index}`} className="job-apply-link-row">
            <select
              className="admin-settings-input"
              value={link.platform}
              onChange={(e) =>
                setProfileLinks((prev) =>
                  prev.map((item, i) =>
                    i === index ? { ...item, platform: e.target.value } : item
                  )
                )
              }
              aria-label={`Platform ${index + 1}`}
            >
              {JOB_PROFILE_LINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PLATFORM_LABELS[type] || type}
                </option>
              ))}
            </select>
            <input
              className="admin-settings-input"
              type="url"
              placeholder="https://"
              value={link.url}
              onChange={(e) =>
                setProfileLinks((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, url: e.target.value } : item))
                )
              }
              aria-label={`URL ${index + 1}`}
            />
            <button
              type="button"
              className="job-apply-remove-link"
              onClick={() => setProfileLinks((prev) => prev.filter((_, i) => i !== index))}
              aria-label={`Remove link ${index + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </section>

      {TURNSTILE_SITE_KEY ? (
        <div className="job-apply-turnstile">
          <Turnstile
            ref={turnstileRef as never}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={resetTurnstile}
            onError={resetTurnstile}
          />
        </div>
      ) : null}

      {submitError ? <p className="job-apply-error" role="alert">{submitError}</p> : null}

      <p className="job-apply-privacy">
        By submitting this application, you agree that FlaireStack may use the information you
        provide to evaluate your candidacy and communicate with you about the hiring process.
        Your resume and application details are treated as confidential and are accessible only
        to authorized administrators.
      </p>

      <div className="job-apply-actions">
        <Link href={publicCareerPath(job.slug)} className="blog-back-link">
          ← Back to role
        </Link>
        <button type="submit" className="careers-job-cta" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="admin-settings-spinner" aria-hidden />
              Submitting…
            </>
          ) : (
            'Submit application'
          )}
        </button>
      </div>
    </form>
  )
}
