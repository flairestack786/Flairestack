import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Archive,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  PhoneCall,
  RefreshCw,
  Save,
  Send,
  X,
} from 'lucide-react'
import EditorField from '../home/EditorField'
import AdminSelect from '../AdminSelect'
import { useToast } from '../../common/ToastProvider'
import {
  addLeadTimelineNote,
  formatLeadPriority,
  formatLeadStatus,
  formatLeadTimelineSummary,
  LEAD_PRIORITY_OPTIONS,
  LEAD_STATUS_OPTIONS,
  listLeadTimeline,
  setLeadPriority,
  setLeadStatus,
  updateLead,
} from '../../../lib/leads'

/**
 * @param {Record<string, unknown> | null} lead
 */
function leadToForm(lead) {
  return {
    full_name: String(lead?.full_name ?? ''),
    email: String(lead?.email ?? ''),
    phone: String(lead?.phone ?? ''),
    company: String(lead?.company ?? ''),
    service_interest: String(lead?.service_interest ?? ''),
    message: String(lead?.message ?? ''),
    source: String(lead?.source ?? ''),
    admin_notes: String(lead?.admin_notes ?? ''),
    status: String(lead?.status ?? 'new'),
    priority: String(lead?.priority ?? 'medium'),
  }
}

/**
 * @param {unknown} value
 */
function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * @param {Record<string, unknown>} event
 */
function timelineSummary(event) {
  return formatLeadTimelineSummary(event)
}

/**
 * Complete CRM editor for a single lead.
 * @param {{
 *   lead: Record<string, unknown> | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onLeadUpdated?: (lead: Record<string, unknown>) => void,
 * }} props
 */
export default function LeadDetailDrawer({ lead, isOpen, onClose, onLeadUpdated }) {
  const titleId = useId()
  const closeRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const { success, error } = useToast()

  const [draft, setDraft] = useState(() => leadToForm(lead))
  const [baseline, setBaseline] = useState(() => leadToForm(lead))
  const [timeline, setTimeline] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [timelineStatus, setTimelineStatus] = useState(
    /** @type {'idle' | 'loading' | 'ready' | 'error'} */ ('idle')
  )
  const [timelineError, setTimelineError] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [busyAction, setBusyAction] = useState('')

  const leadId = lead ? String(lead.id ?? '') : ''

  const loadTimeline = useCallback(async (id) => {
    if (!id) return
    setTimelineStatus('loading')
    setTimelineError('')
    try {
      const rows = await listLeadTimeline(id)
      setTimeline(rows)
      setTimelineStatus('ready')
    } catch (err) {
      setTimelineError(err?.message ?? 'Failed to load timeline.')
      setTimelineStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !lead) return
    const next = leadToForm(lead)
    setDraft(next)
    setBaseline(next)
    setNoteBody('')
    loadTimeline(String(lead.id))
  }, [isOpen, lead, loadTimeline])

  useEffect(() => {
    if (!isOpen) return undefined

    const previous = document.activeElement
    closeRef.current?.focus()

    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [isOpen, onClose])

  const detailsDirty = useMemo(() => {
    return (
      draft.full_name !== baseline.full_name ||
      draft.email !== baseline.email ||
      draft.phone !== baseline.phone ||
      draft.company !== baseline.company ||
      draft.service_interest !== baseline.service_interest ||
      draft.message !== baseline.message
    )
  }, [draft, baseline])

  const notesDirty = draft.admin_notes !== baseline.admin_notes

  const setField = useCallback((field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }, [])

  const applyUpdatedLead = useCallback(
    (updated) => {
      const nextStatus = String(updated.status ?? 'new')
      const nextPriority = String(updated.priority ?? 'medium')
      setDraft((current) => ({
        ...current,
        status: nextStatus,
        priority: nextPriority,
        source: String(updated.source ?? current.source),
      }))
      setBaseline((current) => ({
        ...current,
        status: nextStatus,
        priority: nextPriority,
        source: String(updated.source ?? current.source),
      }))
      onLeadUpdated?.(updated)
    },
    [onLeadUpdated]
  )

  const handleSaveDetails = useCallback(async () => {
    if (!leadId || isSavingDetails || !detailsDirty) return
    setIsSavingDetails(true)
    try {
      const updated = await updateLead(leadId, {
        full_name: draft.full_name,
        email: draft.email,
        phone: draft.phone,
        company: draft.company,
        service_interest: draft.service_interest,
        message: draft.message,
      })
      const next = leadToForm(updated)
      setDraft((current) => ({ ...next, admin_notes: current.admin_notes }))
      setBaseline((current) => ({ ...next, admin_notes: current.admin_notes }))
      onLeadUpdated?.(updated)
      success('Contact details saved')
    } catch (err) {
      error(err?.message ?? 'Failed to save contact details')
    } finally {
      setIsSavingDetails(false)
    }
  }, [
    detailsDirty,
    draft.company,
    draft.email,
    draft.full_name,
    draft.message,
    draft.phone,
    draft.service_interest,
    error,
    isSavingDetails,
    leadId,
    onLeadUpdated,
    success,
  ])

  const handleSaveNotes = useCallback(async () => {
    if (!leadId || isSavingNotes || !notesDirty) return
    setIsSavingNotes(true)
    try {
      const updated = await updateLead(leadId, {
        admin_notes: draft.admin_notes.trim() === '' ? null : draft.admin_notes,
      })
      setBaseline((current) => ({ ...current, admin_notes: String(updated.admin_notes ?? '') }))
      setDraft((current) => ({ ...current, admin_notes: String(updated.admin_notes ?? '') }))
      onLeadUpdated?.(updated)
      success('Internal notes saved')
    } catch (err) {
      error(err?.message ?? 'Failed to save notes')
    } finally {
      setIsSavingNotes(false)
    }
  }, [draft.admin_notes, error, isSavingNotes, leadId, notesDirty, onLeadUpdated, success])

  const handleStatusChange = useCallback(
    async (nextStatus) => {
      if (!leadId || busyAction || nextStatus === draft.status) return
      setBusyAction(`status:${nextStatus}`)
      try {
        const updated = await setLeadStatus(leadId, nextStatus)
        applyUpdatedLead(updated)
        await loadTimeline(leadId)
        success(`Status set to ${formatLeadStatus(nextStatus)}`)
      } catch (err) {
        error(err?.message ?? 'Failed to update status')
      } finally {
        setBusyAction('')
      }
    },
    [applyUpdatedLead, busyAction, draft.status, error, leadId, loadTimeline, success]
  )

  const handlePriorityChange = useCallback(
    async (nextPriority) => {
      if (!leadId || busyAction || nextPriority === draft.priority) return
      setBusyAction(`priority:${nextPriority}`)
      try {
        const updated = await setLeadPriority(leadId, nextPriority)
        applyUpdatedLead(updated)
        await loadTimeline(leadId)
        success(`Priority set to ${formatLeadPriority(nextPriority)}`)
      } catch (err) {
        error(err?.message ?? 'Failed to update priority')
      } finally {
        setBusyAction('')
      }
    },
    [applyUpdatedLead, busyAction, draft.priority, error, leadId, loadTimeline, success]
  )

  const handleAddNote = useCallback(async () => {
    if (!leadId || isSavingNote) return
    const body = noteBody.trim()
    if (!body) {
      error('Enter a note before adding.')
      return
    }

    setIsSavingNote(true)
    try {
      await addLeadTimelineNote(leadId, { body, title: 'Note' })
      setNoteBody('')
      await loadTimeline(leadId)
      success('Note added')
    } catch (err) {
      error(err?.message ?? 'Failed to add note')
    } finally {
      setIsSavingNote(false)
    }
  }, [error, isSavingNote, leadId, loadTimeline, noteBody, success])

  if (!isOpen || !lead) return null

  const createdAt = formatDateTime(lead.created_at)
  const isBusy = Boolean(busyAction)

  return (
    <div className="admin-leads-drawer-root" role="presentation">
      <button
        type="button"
        className="admin-leads-drawer-backdrop"
        aria-label="Close lead details"
        onClick={onClose}
      />

      <aside
        className="admin-leads-drawer admin-leads-drawer--editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-leads-drawer-header">
          <div>
            <p className="admin-leads-drawer-kicker">{String(lead.lead_number ?? '')}</p>
            <h2 id={titleId} className="admin-leads-drawer-title">
              {draft.full_name || 'Lead'}
            </h2>
            <p className="admin-leads-drawer-subtitle">Received {createdAt}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="admin-leads-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className="admin-leads-drawer-badges">
          <span className={`admin-leads-badge admin-leads-badge--status-${draft.status}`}>
            {formatLeadStatus(draft.status)}
          </span>
          <span className={`admin-leads-badge admin-leads-badge--priority-${draft.priority}`}>
            {formatLeadPriority(draft.priority)}
          </span>
        </div>

        <div className="admin-leads-drawer-body">
          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Quick Actions</h3>
            </header>
            <div className="admin-leads-quick-actions">
              <button
                type="button"
                className="admin-leads-action-btn"
                disabled={isBusy || draft.status === 'contacted'}
                onClick={() => handleStatusChange('contacted')}
              >
                <PhoneCall size={15} strokeWidth={1.75} aria-hidden />
                Mark Contacted
              </button>
              <button
                type="button"
                className="admin-leads-action-btn admin-leads-action-btn--success"
                disabled={isBusy || draft.status === 'won'}
                onClick={() => handleStatusChange('won')}
              >
                <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden />
                Mark Won
              </button>
              <button
                type="button"
                className="admin-leads-action-btn"
                disabled={isBusy || draft.status === 'archived'}
                onClick={() => handleStatusChange('archived')}
              >
                <Archive size={15} strokeWidth={1.75} aria-hidden />
                Archive
              </button>
              {draft.email && (
                <a className="admin-leads-action-btn" href={`mailto:${draft.email}`}>
                  <Mail size={15} strokeWidth={1.75} aria-hidden />
                  Email
                </a>
              )}
              {draft.phone && (
                <a className="admin-leads-action-btn" href={`tel:${draft.phone}`}>
                  <Phone size={15} strokeWidth={1.75} aria-hidden />
                  Call
                </a>
              )}
            </div>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Contact Information</h3>
            </header>
            <div className="admin-leads-drawer-fields">
              <EditorField id="lead-full-name" label="Full name">
                <input
                  id="lead-full-name"
                  type="text"
                  className="admin-settings-input"
                  value={draft.full_name}
                  onChange={(event) => setField('full_name', event.target.value)}
                />
              </EditorField>
              <EditorField id="lead-email" label="Email">
                <input
                  id="lead-email"
                  type="email"
                  className="admin-settings-input"
                  value={draft.email}
                  onChange={(event) => setField('email', event.target.value)}
                />
              </EditorField>
              <EditorField id="lead-phone" label="Phone">
                <input
                  id="lead-phone"
                  type="tel"
                  className="admin-settings-input"
                  value={draft.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                />
              </EditorField>
              <EditorField id="lead-company" label="Company">
                <input
                  id="lead-company"
                  type="text"
                  className="admin-settings-input"
                  value={draft.company}
                  onChange={(event) => setField('company', event.target.value)}
                />
              </EditorField>
            </div>
            <div className="admin-leads-drawer-section-actions">
              <button
                type="button"
                className="admin-leads-save-btn"
                disabled={!detailsDirty || isSavingDetails}
                onClick={handleSaveDetails}
              >
                {isSavingDetails ? (
                  <Loader2 size={15} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
                ) : (
                  <Save size={15} strokeWidth={1.75} aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save contact'}
              </button>
            </div>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Project Details</h3>
            </header>
            <div className="admin-leads-drawer-fields">
              <EditorField id="lead-service" label="Service interest">
                <input
                  id="lead-service"
                  type="text"
                  className="admin-settings-input"
                  value={draft.service_interest}
                  onChange={(event) => setField('service_interest', event.target.value)}
                />
              </EditorField>
              <EditorField id="lead-source" label="Source" hint="Set when the lead was created.">
                <input
                  id="lead-source"
                  type="text"
                  className="admin-settings-input"
                  value={draft.source}
                  readOnly
                />
              </EditorField>
              <EditorField id="lead-message" label="Message">
                <textarea
                  id="lead-message"
                  className="admin-settings-textarea"
                  rows={5}
                  value={draft.message}
                  onChange={(event) => setField('message', event.target.value)}
                />
              </EditorField>
            </div>
            <div className="admin-leads-drawer-section-actions">
              <button
                type="button"
                className="admin-leads-save-btn"
                disabled={!detailsDirty || isSavingDetails}
                onClick={handleSaveDetails}
              >
                {isSavingDetails ? (
                  <Loader2 size={15} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
                ) : (
                  <Save size={15} strokeWidth={1.75} aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save project details'}
              </button>
            </div>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Status</h3>
            </header>
            <EditorField id="lead-status" label="Pipeline status">
              <AdminSelect
                id="lead-status"
                aria-label="Pipeline status"
                value={draft.status}
                disabled={isBusy}
                onChange={handleStatusChange}
                options={LEAD_STATUS_OPTIONS.map((value) => ({
                  value,
                  label: formatLeadStatus(value),
                }))}
              />
            </EditorField>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Priority</h3>
            </header>
            <EditorField id="lead-priority" label="Priority">
              <AdminSelect
                id="lead-priority"
                aria-label="Priority"
                value={draft.priority}
                disabled={isBusy}
                onChange={handlePriorityChange}
                options={LEAD_PRIORITY_OPTIONS.map((value) => ({
                  value,
                  label: formatLeadPriority(value),
                }))}
              />
            </EditorField>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Internal Notes</h3>
            </header>
            <EditorField
              id="lead-admin-notes"
              label="Private notes"
              hint="Visible only to admins. Not shown on the public site."
            >
              <textarea
                id="lead-admin-notes"
                className="admin-settings-textarea"
                rows={4}
                value={draft.admin_notes}
                onChange={(event) => setField('admin_notes', event.target.value)}
                placeholder="Discovery call notes, budget signals, next steps…"
              />
            </EditorField>
            <div className="admin-leads-drawer-section-actions">
              <button
                type="button"
                className="admin-leads-save-btn"
                disabled={!notesDirty || isSavingNotes}
                onClick={handleSaveNotes}
              >
                {isSavingNotes ? (
                  <Loader2 size={15} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
                ) : (
                  <Save size={15} strokeWidth={1.75} aria-hidden />
                )}
                {isSavingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Timeline</h3>
              <button
                type="button"
                className="admin-leads-timeline-refresh"
                onClick={() => loadTimeline(leadId)}
                disabled={timelineStatus === 'loading'}
                aria-label="Refresh timeline"
              >
                <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </header>

            <div className="admin-leads-note-composer">
              <label htmlFor="lead-timeline-note" className="admin-settings-label">
                Add note
              </label>
              <textarea
                id="lead-timeline-note"
                className="admin-settings-textarea"
                rows={3}
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Log a call, email, or internal update…"
              />
              <button
                type="button"
                className="admin-leads-save-btn"
                disabled={isSavingNote || noteBody.trim() === ''}
                onClick={handleAddNote}
              >
                {isSavingNote ? (
                  <Loader2 size={15} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
                ) : (
                  <Send size={15} strokeWidth={1.75} aria-hidden />
                )}
                {isSavingNote ? 'Adding…' : 'Add Note'}
              </button>
            </div>

            {timelineStatus === 'loading' && (
              <div className="admin-leads-timeline-state" role="status">
                <Loader2 size={16} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
                Loading timeline…
              </div>
            )}

            {timelineStatus === 'error' && (
              <div className="admin-leads-timeline-state admin-leads-timeline-state--error" role="alert">
                <span>{timelineError}</span>
                <button type="button" className="admin-settings-retry" onClick={() => loadTimeline(leadId)}>
                  Retry
                </button>
              </div>
            )}

            {timelineStatus === 'ready' && timeline.length === 0 && (
              <p className="admin-leads-timeline-empty">No timeline events yet.</p>
            )}

            {timelineStatus === 'ready' && timeline.length > 0 && (
              <ol className="admin-leads-timeline">
                {timeline.map((event) => (
                  <li key={String(event.id)} className="admin-leads-timeline-item">
                    <div className="admin-leads-timeline-dot" aria-hidden />
                    <div className="admin-leads-timeline-content">
                      <div className="admin-leads-timeline-top">
                        <span className="admin-leads-timeline-title">
                          {String(event.title || formatLeadStatus(String(event.event_type ?? '')))}
                        </span>
                        <time dateTime={String(event.created_at ?? '')}>
                          {formatDateTime(event.created_at)}
                        </time>
                      </div>
                      <p className="admin-leads-timeline-body">{timelineSummary(event)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}
