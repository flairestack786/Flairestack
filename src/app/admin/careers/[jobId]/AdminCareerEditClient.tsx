'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Briefcase, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import RichTextEditor from '@/components/admin/RichTextEditor'
import EditorField from '@/components/admin/home/EditorField'
import EditorSection from '@/components/admin/home/EditorSection'
import SaveBar from '@/components/admin/settings/SaveBar'
import { useToast } from '@/components/common/ToastProvider'
import { canonicalizeContentSlug, publicCareerPath } from '@/lib/contentSlug'
import {
  getJobPosting,
  setJobPostingStatus,
  updateJobPosting,
  type JobEmploymentType,
  type JobPostingStatus,
  type JobWorkArrangement,
} from '@/lib/next/careersBrowser'

type JobForm = {
  title: string
  slug: string
  department: string
  employment_type: JobEmploymentType
  work_arrangement: JobWorkArrangement
  location: string
  short_description: string
  description_html: string
  responsibilities_html: string
  qualifications_html: string
  application_instructions: string
  application_email: string
  application_url: string
  closing_date: string
  status: JobPostingStatus
  slugLocked: boolean
}

function emptyForm(): JobForm {
  return {
    title: '',
    slug: '',
    department: '',
    employment_type: 'full_time',
    work_arrangement: 'remote',
    location: '',
    short_description: '',
    description_html: '',
    responsibilities_html: '',
    qualifications_html: '',
    application_instructions: '',
    application_email: '',
    application_url: '',
    closing_date: '',
    status: 'draft',
    slugLocked: false,
  }
}

function rowToForm(row: Record<string, unknown>): JobForm {
  const employment = String(row.employment_type ?? 'full_time') as JobEmploymentType
  const arrangement = String(row.work_arrangement ?? 'remote') as JobWorkArrangement
  const status = String(row.status ?? 'draft') as JobPostingStatus
  return {
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    department: String(row.department ?? ''),
    employment_type: ['full_time', 'part_time', 'contract', 'internship'].includes(employment)
      ? employment
      : 'full_time',
    work_arrangement: ['on_site', 'hybrid', 'remote'].includes(arrangement)
      ? arrangement
      : 'remote',
    location: String(row.location ?? ''),
    short_description: String(row.short_description ?? ''),
    description_html: String(row.description_html ?? ''),
    responsibilities_html: String(row.responsibilities_html ?? ''),
    qualifications_html: String(row.qualifications_html ?? ''),
    application_instructions: String(row.application_instructions ?? ''),
    application_email: String(row.application_email ?? ''),
    application_url: String(row.application_url ?? ''),
    closing_date: row.closing_date ? String(row.closing_date).slice(0, 10) : '',
    status: ['draft', 'published', 'closed'].includes(status) ? status : 'draft',
    slugLocked: true,
  }
}

function formToPayload(form: JobForm): Record<string, unknown> {
  return {
    title: form.title,
    slug: form.slug,
    department: form.department,
    employment_type: form.employment_type,
    work_arrangement: form.work_arrangement,
    location: form.location,
    short_description: form.short_description,
    description_html: form.description_html,
    responsibilities_html: form.responsibilities_html,
    qualifications_html: form.qualifications_html,
    application_instructions: form.application_instructions,
    application_email: form.application_email || null,
    application_url: form.application_url || null,
    closing_date: form.closing_date || null,
  }
}

function formsEqual(a: JobForm, b: JobForm) {
  return JSON.stringify(formToPayload(a)) === JSON.stringify(formToPayload(b))
}

export default function AdminCareerEditClient() {
  const params = useParams()
  const jobId = typeof params?.jobId === 'string' ? params.jobId : ''
  const toast = useToast() as { success: (m: string) => void; error: (m: string) => void }
  const { success, error } = toast

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<JobForm>(emptyForm)
  const [saved, setSaved] = useState<JobForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)

  const dirty = useMemo(() => !formsEqual(form, saved), [form, saved])
  const publicPath = publicCareerPath(form.slug)

  const load = useCallback(async () => {
    if (!jobId) return
    setStatus('loading')
    setLoadError('')
    try {
      const row = await getJobPosting(jobId)
      const next = rowToForm(row)
      setForm(structuredClone(next))
      setSaved(structuredClone(next))
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load job posting.')
      setStatus('error')
    }
  }, [jobId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = <K extends keyof JobForm>(key: K, value: JobForm[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'title' && !current.slugLocked) {
        next.slug = canonicalizeContentSlug(String(value))
      }
      return next
    })
  }

  const handleSave = useCallback(async () => {
    if (!jobId || saving) return
    setSaving(true)
    try {
      const updated = await updateJobPosting(jobId, formToPayload(form))
      const next = rowToForm(updated)
      setForm(structuredClone(next))
      setSaved(structuredClone(next))
      success('Job posting saved')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save job posting')
    } finally {
      setSaving(false)
    }
  }, [error, form, jobId, saving, success])

  const handleSetStatus = useCallback(
    async (nextStatus: JobPostingStatus) => {
      if (!jobId || statusBusy) return
      if (dirty) {
        error('Save your changes before changing status.')
        return
      }
      setStatusBusy(true)
      try {
        const updated = await setJobPostingStatus(jobId, nextStatus)
        const next = rowToForm(updated)
        setForm(structuredClone(next))
        setSaved(structuredClone(next))
        success(
          nextStatus === 'published'
            ? 'Job published'
            : nextStatus === 'closed'
              ? 'Job closed'
              : 'Job moved to draft'
        )
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setStatusBusy(false)
      }
    },
    [dirty, error, jobId, statusBusy, success]
  )

  if (status === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading job posting…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>{loadError}</span>
        <button type="button" className="admin-settings-retry" onClick={() => void load()}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Briefcase size={22} strokeWidth={1.75} />
        </span>
        <div>
          <Link href="/admin/careers" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Back to Careers
          </Link>
          <h1 className="admin-page-title">{form.title || 'Untitled role'}</h1>
          <p className="admin-page-desc">
            Status:{' '}
            <span
              className={`admin-services-status${
                form.status === 'published'
                  ? ' admin-services-status--published'
                  : form.status === 'closed'
                    ? ' admin-services-status--closed'
                    : ' admin-services-status--draft'
              }`}
            >
              {form.status === 'published'
                ? 'Published'
                : form.status === 'closed'
                  ? 'Closed'
                  : 'Draft'}
            </span>
          </p>
        </div>
        <div className="admin-page-header-actions">
          {form.status === 'published' && publicPath ? (
            <Link
              href={publicPath}
              className="admin-services-action-btn"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden />
              Preview live
            </Link>
          ) : null}
          {form.status !== 'published' ? (
            <button
              type="button"
              className="admin-services-action-btn"
              disabled={statusBusy || dirty}
              onClick={() => void handleSetStatus('published')}
            >
              Publish
            </button>
          ) : (
            <button
              type="button"
              className="admin-services-action-btn"
              disabled={statusBusy || dirty}
              onClick={() => void handleSetStatus('draft')}
            >
              Unpublish
            </button>
          )}
          {form.status !== 'closed' ? (
            <button
              type="button"
              className="admin-services-action-btn"
              disabled={statusBusy || dirty}
              onClick={() => void handleSetStatus('closed')}
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="admin-settings-stack">
        <EditorSection
          panelId="job-basics"
          labelledBy="job-basics-heading"
          title="Role details"
          description="Title, department, and work arrangement."
        >
          <EditorField id="job-title" label="Job title">
            <input
              id="job-title"
              className="admin-settings-input"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-slug" label="URL slug" hint="Lowercase letters, numbers, hyphens.">
            <input
              id="job-slug"
              className="admin-settings-input"
              value={form.slug}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  slug: canonicalizeContentSlug(event.target.value),
                  slugLocked: true,
                }))
              }}
            />
          </EditorField>
          <EditorField id="job-department" label="Department">
            <input
              id="job-department"
              className="admin-settings-input"
              value={form.department}
              onChange={(event) => updateField('department', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-employment" label="Employment type">
            <select
              id="job-employment"
              className="admin-settings-input"
              value={form.employment_type}
              onChange={(event) =>
                updateField('employment_type', event.target.value as JobEmploymentType)
              }
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </EditorField>
          <EditorField id="job-arrangement" label="Work arrangement">
            <select
              id="job-arrangement"
              className="admin-settings-input"
              value={form.work_arrangement}
              onChange={(event) =>
                updateField('work_arrangement', event.target.value as JobWorkArrangement)
              }
            >
              <option value="on_site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </EditorField>
          <EditorField id="job-location" label="Location">
            <input
              id="job-location"
              className="admin-settings-input"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-short" label="Short description">
            <textarea
              id="job-short"
              className="admin-settings-textarea"
              rows={3}
              value={form.short_description}
              onChange={(event) => updateField('short_description', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-closing" label="Closing date (optional)">
            <input
              id="job-closing"
              type="date"
              className="admin-settings-input"
              value={form.closing_date}
              onChange={(event) => updateField('closing_date', event.target.value)}
            />
          </EditorField>
        </EditorSection>

        <EditorSection
          panelId="job-description"
          labelledBy="job-description-heading"
          title="Description"
          description="Full posting content shown on the public Careers detail page."
        >
          <EditorField id="job-description" label="Full job description">
            <RichTextEditor
              value={form.description_html}
              onChange={(html) => updateField('description_html', html)}
            />
          </EditorField>
          <EditorField id="job-responsibilities" label="Responsibilities">
            <RichTextEditor
              value={form.responsibilities_html}
              onChange={(html) => updateField('responsibilities_html', html)}
            />
          </EditorField>
          <EditorField id="job-qualifications" label="Qualifications and requirements">
            <RichTextEditor
              value={form.qualifications_html}
              onChange={(html) => updateField('qualifications_html', html)}
            />
          </EditorField>
        </EditorSection>

        <EditorSection
          panelId="job-apply"
          labelledBy="job-apply-heading"
          title="Application"
          description="How candidates should apply."
        >
          <EditorField id="job-instructions" label="Application instructions">
            <textarea
              id="job-instructions"
              className="admin-settings-textarea"
              rows={4}
              value={form.application_instructions}
              onChange={(event) => updateField('application_instructions', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-email" label="Application email (optional)">
            <input
              id="job-email"
              type="email"
              className="admin-settings-input"
              value={form.application_email}
              onChange={(event) => updateField('application_email', event.target.value)}
            />
          </EditorField>
          <EditorField id="job-url" label="Application URL (optional)">
            <input
              id="job-url"
              type="url"
              className="admin-settings-input"
              value={form.application_url}
              onChange={(event) => updateField('application_url', event.target.value)}
            />
          </EditorField>
        </EditorSection>
      </div>

      <SaveBar isDirty={dirty} isSaving={saving} onSave={() => void handleSave()} />
    </div>
  )
}
