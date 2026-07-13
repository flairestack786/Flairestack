import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Save, Shield, UserX, X } from 'lucide-react'
import EditorField from '../home/EditorField'
import AdminSelect from '../AdminSelect'
import ConfirmationModal from '../ConfirmationModal'
import UserAvatar from './UserAvatar'
import { useToast } from '../../common/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { LAST_ADMIN_GUARD_MESSAGE } from '../../../lib/cmsPermissions'
import {
  CMS_ROLE_OPTIONS,
  CMS_USER_STATUS_OPTIONS,
  formatCmsRole,
  formatCmsUserStatus,
  requestPasswordReset,
  setUserStatus,
  updateUser,
} from '../../../lib/users'

/**
 * @param {Record<string, unknown> | null} user
 */
function userToForm(user) {
  return {
    full_name: String(user?.full_name ?? ''),
    notes: String(user?.notes ?? ''),
    role: String(user?.role ?? 'administrator'),
    status: String(user?.status ?? 'active'),
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
 * CRM-style editor for a CMS user profile.
 * @param {{
 *   user: Record<string, unknown> | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onUserUpdated?: (user: Record<string, unknown>) => void,
 * }} props
 */
export default function UserDetailDrawer({ user, isOpen, onClose, onUserUpdated }) {
  const titleId = useId()
  const closeRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const { success, error } = useToast()
  const { user: authUser } = useAuth()

  const [draft, setDraft] = useState(() => userToForm(user))
  const [baseline, setBaseline] = useState(() => userToForm(user))
  const [isSaving, setIsSaving] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [confirmDisable, setConfirmDisable] = useState(false)

  const userId = user ? String(user.id ?? '') : ''

  useEffect(() => {
    if (!isOpen || !user) return
    const next = userToForm(user)
    setDraft(next)
    setBaseline(next)
  }, [isOpen, user])

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

  const dirty = useMemo(() => {
    return (
      draft.full_name !== baseline.full_name ||
      draft.notes !== baseline.notes ||
      draft.role !== baseline.role ||
      draft.status !== baseline.status
    )
  }, [draft, baseline])

  const isBusy = isSaving || busyAction !== ''

  const handleSave = useCallback(async () => {
    if (!userId || !dirty) return
    setIsSaving(true)
    try {
      const updated = await updateUser(userId, {
        full_name: draft.full_name,
        notes: draft.notes,
        role: draft.role,
        status: draft.status,
      })
      setBaseline(userToForm(updated))
      setDraft(userToForm(updated))
      onUserUpdated?.(updated)
      success('User profile saved.')
    } catch (err) {
      const message = err?.message ?? 'Failed to save user.'
      error(message.includes('last active Administrator') ? LAST_ADMIN_GUARD_MESSAGE : message)
    } finally {
      setIsSaving(false)
    }
  }, [userId, dirty, draft, onUserUpdated, success, error])

  const handleStatusAction = useCallback(
    async (nextStatus) => {
      if (!userId) return
      if (nextStatus === 'disabled' && userId === authUser?.id) {
        error('You cannot disable your own account while signed in.')
        return
      }
      setBusyAction(nextStatus)
      try {
        const updated = await setUserStatus(userId, nextStatus)
        const form = userToForm(updated)
        setDraft(form)
        setBaseline(form)
        onUserUpdated?.(updated)
        success(`User marked as ${formatCmsUserStatus(nextStatus)}.`)
        setConfirmDisable(false)
      } catch (err) {
        const message = err?.message ?? 'Failed to update status.'
        error(message.includes('last active Administrator') ? LAST_ADMIN_GUARD_MESSAGE : message)
      } finally {
        setBusyAction('')
      }
    },
    [userId, authUser?.id, onUserUpdated, success, error]
  )

  const handlePasswordReset = useCallback(async () => {
    if (!userId) return
    setBusyAction('reset')
    try {
      await requestPasswordReset(userId)
      success('Password reset email sent.')
    } catch (err) {
      error(err?.message ?? 'Failed to send password reset.')
    } finally {
      setBusyAction('')
    }
  }, [userId, success, error])

  if (!isOpen || !user) return null

  const roleOptions = CMS_ROLE_OPTIONS.map((value) => ({
    value,
    label: formatCmsRole(value),
  }))

  const statusOptions = CMS_USER_STATUS_OPTIONS.map((value) => ({
    value,
    label: formatCmsUserStatus(value),
  }))

  return (
    <div className="admin-leads-drawer-root admin-users-drawer-root">
      <button
        type="button"
        className="admin-leads-drawer-backdrop"
        aria-label="Close user drawer"
        onClick={onClose}
      />
      <aside
        className="admin-leads-drawer admin-leads-drawer--editor admin-users-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-leads-drawer-header">
          <div className="admin-users-drawer-heading">
            <UserAvatar
              fullName={String(user.full_name ?? '')}
              email={String(user.email ?? '')}
              avatarPath={user.avatar_path ? String(user.avatar_path) : null}
              size="md"
            />
            <div>
              <p className="admin-leads-drawer-kicker">CMS User</p>
              <h2 id={titleId} className="admin-leads-drawer-title">
                {String(user.full_name || user.email || 'User')}
              </h2>
              <p className="admin-leads-drawer-subtitle">{String(user.email ?? '')}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="admin-leads-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <div className="admin-leads-drawer-badges">
          <span className={`admin-users-badge admin-users-badge--role-${user.role}`}>
            {formatCmsRole(String(user.role ?? ''))}
          </span>
          <span className={`admin-users-badge admin-users-badge--status-${user.status}`}>
            {formatCmsUserStatus(String(user.status ?? ''))}
          </span>
        </div>

        <div className="admin-leads-drawer-body">
          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Profile</h3>
            </header>
            <EditorField id="user-full-name" label="Full name">
              <input
                id="user-full-name"
                className="admin-settings-input"
                value={draft.full_name}
                disabled={isBusy}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, full_name: event.target.value }))
                }
              />
            </EditorField>
            <EditorField id="user-email" label="Email">
              <input
                id="user-email"
                className="admin-settings-input"
                value={String(user.email ?? '')}
                disabled
                readOnly
              />
            </EditorField>
            <p className="admin-users-field-hint">
              Email is managed by Supabase Auth and synced to the profile automatically.
            </p>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Access</h3>
            </header>
            <EditorField id="user-role" label="Role">
              <AdminSelect
                id="user-role"
                aria-label="Role"
                value={draft.role}
                disabled={isBusy}
                onChange={(value) => setDraft((current) => ({ ...current, role: value }))}
                options={roleOptions}
              />
            </EditorField>
            <EditorField id="user-status" label="Status">
              <AdminSelect
                id="user-status"
                aria-label="Status"
                value={draft.status}
                disabled={isBusy}
                onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
                options={statusOptions}
              />
            </EditorField>
            <p className="admin-users-field-hint">
              Administrator: full CMS access. Editor: content modules only. Sales: dashboard and
              leads only.
            </p>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Internal notes</h3>
            </header>
            <EditorField id="user-notes" label="Notes">
              <textarea
                id="user-notes"
                className="admin-settings-input admin-settings-textarea"
                rows={4}
                value={draft.notes}
                disabled={isBusy}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </EditorField>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Activity</h3>
            </header>
            <dl className="admin-users-meta">
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(user.created_at)}</dd>
              </div>
              <div>
                <dt>Last sign-in</dt>
                <dd>{formatDateTime(user.last_sign_in_at)}</dd>
              </div>
              <div>
                <dt>Invited</dt>
                <dd>{formatDateTime(user.invited_at)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDateTime(user.updated_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-leads-drawer-section">
            <header className="admin-leads-drawer-section-header">
              <h3>Quick actions</h3>
            </header>
            <div className="admin-leads-drawer-section-actions">
              <button
                type="button"
                className="admin-services-create-btn"
                disabled={isBusy || !dirty}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 size={16} strokeWidth={1.75} className="admin-settings-spinner" />
                ) : (
                  <Save size={16} strokeWidth={1.75} />
                )}
                Save changes
              </button>
              {draft.status !== 'active' && (
                <button
                  type="button"
                  className="admin-settings-retry"
                  disabled={isBusy}
                  onClick={() => handleStatusAction('active')}
                >
                  <Shield size={16} strokeWidth={1.75} />
                  Activate
                </button>
              )}
              {draft.status !== 'disabled' && userId !== authUser?.id && (
                <button
                  type="button"
                  className="admin-settings-retry"
                  disabled={isBusy}
                  onClick={() => setConfirmDisable(true)}
                >
                  <UserX size={16} strokeWidth={1.75} />
                  Disable
                </button>
              )}
              <button
                type="button"
                className="admin-settings-retry"
                disabled={isBusy}
                onClick={handlePasswordReset}
              >
                {busyAction === 'reset' ? (
                  <Loader2 size={16} strokeWidth={1.75} className="admin-settings-spinner" />
                ) : (
                  <RefreshCw size={16} strokeWidth={1.75} />
                )}
                Send password reset
              </button>
            </div>
          </section>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={confirmDisable}
        title="Disable this user?"
        message="They will lose CMS access immediately. You can re-enable the account later from this drawer."
        itemName={String(user.full_name || user.email || 'User')}
        confirmLabel="Disable user"
        isLoading={busyAction === 'disabled'}
        onConfirm={() => handleStatusAction('disabled')}
        onCancel={() => {
          if (busyAction !== 'disabled') setConfirmDisable(false)
        }}
      />
    </div>
  )
}
