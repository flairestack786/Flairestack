'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Download, Loader2, RefreshCw, Users } from 'lucide-react'
import { useToast } from '@/components/common/ToastProvider'
import {
  JOB_APPLICATION_STATUSES,
  labelJobApplicationStatus,
} from '@/lib/jobApplicationValidation'
import {
  createResumeDownloadUrl,
  getJobApplication,
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

export default function AdminApplicationDetailClient() {
  const params = useParams()
  const applicationId = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const toast = useToast() as { success: (m: string) => void; error: (m: string) => void }
  const { success, error } = toast

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [row, setRow] = useState<JobApplicationRow | null>(null)
  const [notes, setNotes] = useState('')
  const [appStatus, setAppStatus] = useState('new')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    if (!applicationId) return
    setStatus('loading')
    setLoadError('')
    try {
      const data = await getJobApplication(applicationId)
      setRow(data)
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

  const handleDownload = async () => {
    if (!applicationId || downloading) return
    setDownloading(true)
    try {
      const url = await createResumeDownloadUrl(applicationId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to download resume')
    } finally {
      setDownloading(false)
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
  const links = Array.isArray(row.profile_links) ? row.profile_links : []

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Users size={22} strokeWidth={1.75} />
        </span>
        <div>
          <Link href="/admin/careers/applications" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Back to Applications
          </Link>
          <h1 className="admin-page-title">
            {row.first_name} {row.last_name}
          </h1>
          <p className="admin-page-desc">
            Applied for {job?.title || 'Unknown role'} · {formatDate(row.created_at)}
          </p>
        </div>
      </header>

      <div className="admin-settings-stack">
        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Applicant</h2>
          </header>
          <div className="admin-settings-fields">
            <p>
              <strong>Email:</strong> {row.email}
            </p>
            <p>
              <strong>Phone:</strong> {row.phone || '—'}
            </p>
            <p>
              <strong>Headline:</strong> {row.current_job_title || '—'}
            </p>
            <p>
              <strong>Company:</strong> {row.current_company || '—'}
            </p>
            <p>
              <strong>Location:</strong> {row.location || '—'}
            </p>
            <p>
              <strong>Experience:</strong> {row.years_experience || '—'}
            </p>
            <p>
              <strong>Notice period:</strong> {row.notice_period || '—'}
            </p>
          </div>
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Resume</h2>
          </header>
          <p className="admin-page-desc">
            {String(row.resume_original_filename || 'resume')} ·{' '}
            {Math.round(Number(row.resume_size || 0) / 1024)} KB
          </p>
          <button
            type="button"
            className="admin-services-action-btn"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            <Download size={15} strokeWidth={1.75} aria-hidden />
            {downloading ? 'Preparing…' : 'Download resume'}
          </button>
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Cover letter</h2>
          </header>
          <p style={{ whiteSpace: 'pre-wrap' }}>{row.cover_letter || '—'}</p>
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Professional profiles</h2>
          </header>
          {links.length === 0 ? (
            <p className="admin-page-desc">No profile links submitted.</p>
          ) : (
            <ul>
              {links.map((item, index) => {
                const link = item as { platform?: string; url?: string }
                const typed = link as { platform?: string; url?: string; label?: string }
                const platformLabel =
                  typed.platform === 'other' && typed.label
                    ? typed.label
                    : typed.platform || 'link'
                return (
                  <li key={`${typed.url}-${index}`}>
                    <strong>{platformLabel}:</strong>{' '}
                    <a href={typed.url} target="_blank" rel="noreferrer">
                      {typed.url}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="admin-settings-section">
          <header className="admin-settings-section-header">
            <h2 className="admin-settings-section-title">Admin workflow</h2>
            <p className="admin-settings-section-desc">
              Internal notes are never shown to applicants.
            </p>
            <div
              className={
                row.confirmation_email_status === 'sent'
                  ? 'admin-page-desc'
                  : 'admin-settings-state admin-settings-state--error'
              }
              role="status"
              style={{ marginBottom: '1rem' }}
            >
              <strong>Confirmation email:</strong>{' '}
              {String(row.confirmation_email_status || 'pending')}
              {row.confirmation_email_error ? (
                <>
                  <br />
                  <span>{String(row.confirmation_email_error)}</span>
                </>
              ) : null}
            </div>
          </header>
          <div className="admin-settings-fields">
            <label className="admin-settings-field">
              <span className="admin-settings-label">Status</span>
              <select
                className="admin-settings-input"
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value)}
              >
                {JOB_APPLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {labelJobApplicationStatus(value)}
                  </option>
                ))}
              </select>
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
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save status & notes'}
          </button>
        </section>
      </div>
    </div>
  )
}
