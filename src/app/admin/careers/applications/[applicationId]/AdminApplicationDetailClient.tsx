'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Download, Eye, Loader2, RefreshCw, Users } from 'lucide-react'
import AdminSelect from '@/components/admin/AdminSelect'
import { useToast } from '@/components/common/ToastProvider'
import {
  applicantBadgeClass,
  readProfileLinks,
  resumeSizeLabel,
  resumeTypeLabel,
} from '@/lib/applicantsCms'
import {
  JOB_APPLICATION_STATUSES,
  labelJobApplicationStatus,
} from '@/lib/jobApplicationValidation'
import { resumeMimeFromFilename } from '@/lib/resumeAccess'
import {
  getHiringNotificationStatus,
  getJobApplication,
  openResume,
  updateJobApplication,
  type JobApplicationRow,
} from '@/lib/next/jobApplicationsBrowser'

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_OPTIONS = JOB_APPLICATION_STATUSES.map((value) => ({
  value,
  label: labelJobApplicationStatus(value),
}))

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p>
      <strong>{label}:</strong> {children}
    </p>
  )
}

export default function AdminApplicationDetailClient() {
  const params = useParams()
  const applicationId = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const toast = useToast() as {
    success: (m: string) => void
    error: (m: string) => void
    info: (m: string) => void
  }
  const { success, error, info } = toast

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [row, setRow] = useState<JobApplicationRow | null>(null)
  const [hiringEmail, setHiringEmail] = useState<{ status: string; error: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [appStatus, setAppStatus] = useState('new')
  const [saving, setSaving] = useState(false)
  const [busyResume, setBusyResume] = useState<'' | 'view' | 'download'>('')

  const load = useCallback(async () => {
    if (!applicationId) return
    setStatus('loading')
    setLoadError('')
    try {
      const [data, notification] = await Promise.all([
        getJobApplication(applicationId),
        getHiringNotificationStatus(applicationId),
      ])
      setRow(data)
      setHiringEmail(notification)
      setNotes(String(data.internal_notes ?? ''))
      setAppStatus(String(data.application_status ?? 'new'))
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load application.')
      setStatus('error')
    }
  }, [applicationId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    if (!applicationId || saving) return
    setSaving(true)
    try {
      const updated = await updateJobApplication(applicationId, {
        application_status: appStatus,
        internal_notes: notes,
      })
      setRow(updated)
      success('Application updated')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setSaving(false)
    }
  }

  const handleResume = async (mode: 'view' | 'download') => {
    if (!applicationId || busyResume) return
    setBusyResume(mode)
    try {
      // Must be called synchronously from the click so the View tab isn't popup-blocked.
      const result = await openResume(applicationId, mode, {
        mimeType: resumeMimeFromFilename(row?.resume_original_filename),
      })
      if (result.previewUnavailable) {
        info('Word documents can’t be previewed in the browser, so the original file was downloaded.')
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Unable to open the resume.')
    } finally {
      setBusyResume('')
    }
  }

  if (status === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading application…</span>
      </div>
    )
  }

  if (status === 'error' || !row) {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>{loadError || 'Application not found.'}</span>
        <button type="button" className="admin-settings-retry" onClick={() => void load()}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  const job = row.job_postings
  const links = readProfileLinks(row.profile_links)
  const backHref = row.job_posting_id
    ? `/admin/careers/applications/jobs/${row.job_posting_id}`
    : '/admin/careers/applications'
  const sizeLabel = resumeSizeLabel(row.resume_size)
  const hasResume = Boolean(row.resume_original_filename)
  const dirty =
    appStatus !== String(row.application_status ?? '') || notes !== String(row.internal_notes ?? '')

  return (
    <div className="admin-page admin-services-page admin-leads-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Users size={22} strokeWidth={1.75} />
        </span>
        <div>
          <Link href={backHref} className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Back to {job?.title ? `${job.title} applicants` : 'Applicants'}
          </Link>
          <h1 className="admin-page-title">
            {row.first_name} {row.last_name}
          </h1>
          <p className="admin-page-desc">
            Applied for {job?.title || 'Unknown role'} · {formatDate(row.created_at)}
          </p>
        </div>
        <div className="admin-page-header-actions">
          <span className={applicantBadgeClass(row.application_status)}>
            {labelJobApplicationStatus(String(row.application_status))}
          </span>
        </div>
      </header>

      <div className="admin-settings-stack">
        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Personal information</h2>
          </header>
          <div className="admin-settings-fields">
            <Field label="Full name">
              {row.first_name} {row.last_name}
            </Field>
            <Field label="Email">
              <a href={`mailto:${row.email}`}>{row.email}</a>
            </Field>
            <Field label="Phone">{row.phone || '—'}</Field>
            <Field label="Location">{row.location || '—'}</Field>
            <Field label="Current role">{row.current_job_title || '—'}</Field>
            <Field label="Current company">{row.current_company || '—'}</Field>
            <Field label="Experience">{row.years_experience || '—'}</Field>
            <Field label="Notice period">{row.notice_period || '—'}</Field>
          </div>
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Application information</h2>
          </header>
          <div className="admin-settings-fields">
            <Field label="Job applied for">
              {row.job_posting_id ? (
                <Link
                  href={`/admin/careers/applications/jobs/${row.job_posting_id}`}
                  className="admin-services-table-link"
                >
                  {job?.title || 'Unknown role'}
                </Link>
              ) : (
                job?.title || 'Unknown role'
              )}
            </Field>
            {job?.department ? <Field label="Department">{job.department}</Field> : null}
            <Field label="Applied on">{formatDate(row.created_at)}</Field>
            <Field label="Status">{labelJobApplicationStatus(String(row.application_status))}</Field>
          </div>
          <h3 className="admin-settings-label" style={{ marginTop: '1rem' }}>
            Cover letter / message
          </h3>
          {row.cover_letter ? (
            <p style={{ whiteSpace: 'pre-wrap' }}>{row.cover_letter}</p>
          ) : (
            <p className="admin-page-desc">No cover letter or message provided.</p>
          )}
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Professional links</h2>
          </header>
          {links.length === 0 ? (
            <p className="admin-page-desc">No profile links submitted.</p>
          ) : (
            <ul>
              {links.map((link) => (
                <li key={link.key}>
                  <strong>{link.label}:</strong>{' '}
                  <a href={link.url} target="_blank" rel="noopener noreferrer nofollow">
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Resume</h2>
          </header>
          {hasResume ? (
            <>
              <p className="admin-page-desc">
                {String(row.resume_original_filename)} ·{' '}
                {resumeTypeLabel(
                  resumeMimeFromFilename(row.resume_original_filename) ?? row.resume_mime_type
                )}
                {sizeLabel ? ` · ${sizeLabel}` : ''}
              </p>
              <div className="admin-applicants-resume-actions">
                <button
                  type="button"
                  className="admin-services-action-btn"
                  onClick={() => void handleResume('view')}
                  disabled={Boolean(busyResume)}
                >
                  <Eye size={15} strokeWidth={1.75} aria-hidden />
                  {busyResume === 'view' ? 'Preparing…' : 'View resume'}
                </button>
                <button
                  type="button"
                  className="admin-services-action-btn"
                  onClick={() => void handleResume('download')}
                  disabled={Boolean(busyResume)}
                >
                  <Download size={15} strokeWidth={1.75} aria-hidden />
                  {busyResume === 'download' ? 'Preparing…' : 'Download resume'}
                </button>
              </div>
              <p className="admin-page-desc">
                Private file. Links are generated on demand for signed-in administrators and
                expire after 60 seconds.
              </p>
            </>
          ) : (
            <p className="admin-page-desc">No resume on file.</p>
          )}
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Admin workflow</h2>
            <p className="admin-settings-section-desc">
              Status and internal notes are never shown to applicants.
            </p>
            <div
              className={
                row.confirmation_email_status === 'sent'
                  ? 'admin-page-desc'
                  : 'admin-settings-state admin-settings-state--error'
              }
              role="status"
              style={{ marginBottom: '0.5rem' }}
            >
              <strong>Applicant confirmation email:</strong>{' '}
              {String(row.confirmation_email_status || 'pending')}
              {row.confirmation_email_error ? (
                <>
                  <br />
                  <span>{String(row.confirmation_email_error)}</span>
                </>
              ) : null}
            </div>
            {hiringEmail ? (
              <div
                className={
                  hiringEmail.status === 'sent' || hiringEmail.status === 'not_sent'
                    ? 'admin-page-desc'
                    : 'admin-settings-state admin-settings-state--error'
                }
                role="status"
                style={{ marginBottom: '1rem' }}
              >
                <strong>Hiring-team notification:</strong>{' '}
                {hiringEmail.status === 'not_sent'
                  ? 'not recorded (submitted before notifications were tracked)'
                  : hiringEmail.status}
                {hiringEmail.error ? (
                  <>
                    <br />
                    <span>{hiringEmail.error}</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </header>
          <div className="admin-settings-fields">
            <label className="admin-settings-field">
              <span className="admin-settings-label">Status</span>
              <AdminSelect
                id="application-status"
                aria-label="Application status"
                value={appStatus}
                onChange={setAppStatus}
                options={STATUS_OPTIONS}
                placeholder="Select status"
              />
            </label>
            <label className="admin-settings-field admin-settings-field--full">
              <span className="admin-settings-label">Internal notes</span>
              <textarea
                className="admin-settings-textarea"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="admin-services-create-btn"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save status & notes'}
          </button>
        </section>
      </div>
    </div>
  )
}
