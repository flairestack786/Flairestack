import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Copy, Loader2, RefreshCw, Save, X } from 'lucide-react'
import EditorField from '../home/EditorField'
import AdminSelect from '../AdminSelect'
import UserAvatar from './UserAvatar'
import { useToast } from '../../common/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { LAST_ADMIN_GUARD_MESSAGE } from '../../../lib/cmsPermissions'
import {
  CMS_ROLE_OPTIONS,
  CMS_USER_MANAGEABLE_STATUS_OPTIONS,
  formatCmsRole,
  formatCmsUserStatus,
  INVALID_MANAGEABLE_STATUS_MESSAGE,
  requestPasswordReset,
  SELF_ACCOUNT_LOCKOUT_MESSAGE,
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
 *   hasPendingInvite?: boolean,
 * }} props
 */
export default function UserDetailDrawer({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  hasPendingInvite = false,
}) {
  const titleId = useId()
  const closeRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const { success, error } = useToast()
  const { user: authUser } = useAuth()

  const [draft, setDraft] = useState(() => userToForm(user))
  const [baseline, setBaseline] = useState(() => userToForm(user))
  const [isSaving, setIsSaving] = useState(false)
  const [busyAction, setBusyAction] = useState('')

  const userId = user ? String(user.id ?? '') : ''
  const isSelf = Boolean(userId && authUser?.id && userId === authUser.id)

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

    if (isSelf && (draft.role !== baseline.role || draft.status === 'disabled')) {
      error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
      return
    }

    if (
      !isSelf &&
      draft.status !== baseline.status &&
      draft.status !== 'active' &&
      draft.status !== 'disabled'
    ) {
      error(INVALID_MANAGEABLE_STATUS_MESSAGE)
      return
    }

    setIsSaving(true)
    try {
      const statusChanged =
        !isSelf &&
        draft.status !== baseline.status &&
        (draft.status === 'active' || draft.status === 'disabled')

      /** @type {Record<string, unknown>} */
      const payload = {
        full_name: draft.full_name,
        notes: draft.notes,
      }
      // Self-lockout: never send role/status mutations for the signed-in admin.
      if (!isSelf) {
        payload.role = draft.role
      }

      let updated = await updateUser(userId, payload)

      // Status is applied only on Save, via enable/disable APIs (Auth ban sync).
      if (statusChanged) {
        updated = await setUserStatus(
          userId,
          /** @type {'active' | 'disabled'} */ (draft.status)
        )
      }

      setBaseline(userToForm(updated))
      setDraft(userToForm(updated))
      onUserUpdated?.(updated)
      success('User profile saved.')
    } catch (err) {
      const message = err?.message ?? 'Failed to save user.'
      if (message.includes('own account')) {
        error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
      } else if (message.includes('Active or Disabled')) {
        error(INVALID_MANAGEABLE_STATUS_MESSAGE)
      } else {
        error(message.includes('last active Administrator') ? LAST_ADMIN_GUARD_MESSAGE : message)
      }
    } finally {
      setIsSaving(false)
    }
  }, [userId, dirty, draft, baseline.role, baseline.status, isSelf, onUserUpdated, success, error])

  const handlePasswordReset = useCallback(async () => {
    if (!userId) return
    setBusyAction('reset')
    try {
      const result = await requestPasswordReset(userId)
      const sentTo = String(result?.email || user?.email || '').trim()
      success(
        sentTo
          ? `Password reset email sent to ${sentTo}.`
          : 'Password reset email sent.'
      )
    } catch (err) {
      error(err?.message ?? 'Failed to send password reset email.')
    } finally {
      setBusyAction('')
    }
  }, [userId, user?.email, success, error])

  const handleCopyEmail = useCallback(async () => {
    const email = String(user?.email ?? '').trim()
    if (!email) {
      error('No email address available to copy.')
      return
    }
    try {
      await navigator.clipboard.writeText(email)
      success('Email address copied.')
    } catch {
      error('Unable to copy email address.')
    }
  }, [user?.email, success, error])

  if (!isOpen || !user) return null

  const roleOptions = CMS_ROLE_OPTIONS.map((value) => ({
    value,
    label: formatCmsRole(value),
  }))

  const isLifecycleStatus =
    draft.status === 'invited' || draft.status === 'suspended' || hasPendingInvite
  const displayStatus = hasPendingInvite ? 'invited' : draft.status
  const statusOptions = isLifecycleStatus
    ? [
        {
          value: hasPendingInvite ? 'invited' : draft.status,
          label: formatCmsUserStatus(hasPendingInvite ? 'invited' : draft.status),
        },
      ]
    : CMS_USER_MANAGEABLE_STATUS_OPTIONS.map((value) => ({
        value,
        label: formatCmsUserStatus(value),
      }))
  const statusReadOnly = isBusy || isSelf || isLifecycleStatus

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
          <span className={`admin-users-badge admin-users-badge--status-${displayStatus}`}>
            {formatCmsUserStatus(String(displayStatus ?? ''))}
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
            <div className="admin-leads-drawer-fields">
              <EditorField id="user-role" label="Role">
                <AdminSelect
                  id="user-role"
                  aria-label="Role"
                  value={draft.role}
                  disabled={isBusy || isSelf}
                  onChange={(value) => setDraft((current) => ({ ...current, role: value }))}
                  options={roleOptions}
                />
              </EditorField>
              <EditorField
                id="user-status"
                label="Status"
                hint={
                  isSelf
                    ? 'You cannot disable or change the role of your own account.'
                    : isLifecycleStatus
                      ? hasPendingInvite || draft.status === 'invited'
                        ? 'Invited is a lifecycle state until the user completes account setup. Manage pending invites from the Invitations section.'
                        : 'Suspended is not manually assignable in the current workflow.'
                      : 'Change status with this dropdown, then click Save changes. Options: Active or Disabled.'
                }
              >
                <AdminSelect
                  id="user-status"
                  aria-label="Status"
                  value={hasPendingInvite ? 'invited' : draft.status}
                  disabled={statusReadOnly}
                  onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
                  options={statusOptions}
                />
              </EditorField>
            </div>
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
            <div className="admin-leads-drawer-section-actions admin-users-quick-actions">
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
                Send password reset email
              </button>
              <button
                type="button"
                className="admin-settings-retry"
                disabled={isBusy || !String(user.email ?? '').trim()}
                onClick={handleCopyEmail}
              >
                <Copy size={16} strokeWidth={1.75} />
                Copy email address
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
