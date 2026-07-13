import React, { useCallback, useEffect, useId, useState } from 'react'
import { Loader2, MailPlus, X } from 'lucide-react'
import EditorField from '../home/EditorField'
import AdminSelect from '../AdminSelect'
import { useToast } from '../../common/ToastProvider'
import {
  CMS_ROLE_OPTIONS,
  createUserInvite,
  formatCmsRole,
} from '../../../lib/users'

/**
 * Send a Supabase Auth invitation email and create a pending CMS invite record.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onCreated?: (invite: Record<string, unknown>) => void,
 * }} props
 */
export default function InviteUserModal({ isOpen, onClose, onCreated }) {
  const titleId = useId()
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('administrator')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setFullName('')
    setRole('administrator')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setIsSaving(true)
      try {
        const invite = await createUserInvite({
          email,
          full_name: fullName,
          role,
        })
        onCreated?.(invite)
        success('Invitation email sent via Supabase Auth.')
        onClose()
      } catch (err) {
        error(err?.message ?? 'Failed to create invite.')
      } finally {
        setIsSaving(false)
      }
    },
    [email, fullName, role, onCreated, onClose, success, error]
  )

  if (!isOpen) return null

  return (
    <div className="admin-users-modal-root">
      <button
        type="button"
        className="admin-leads-drawer-backdrop"
        aria-label="Close invite modal"
        onClick={onClose}
      />
      <div
        className="admin-users-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-users-modal-header">
          <div>
            <h2 id={titleId} className="admin-users-modal-title">
              Invite user
            </h2>
            <p className="admin-users-modal-desc">
              Sends a Supabase Auth invitation email and creates a pending CMS invite record.
            </p>
          </div>
          <button
            type="button"
            className="admin-leads-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <form className="admin-users-modal-body" onSubmit={handleSubmit}>
          <EditorField id="invite-email" label="Email">
            <input
              id="invite-email"
              type="email"
              required
              className="admin-settings-input"
              value={email}
              disabled={isSaving}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colleague@company.com"
            />
          </EditorField>
          <EditorField id="invite-full-name" label="Full name">
            <input
              id="invite-full-name"
              className="admin-settings-input"
              value={fullName}
              disabled={isSaving}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Optional"
            />
          </EditorField>
          <EditorField id="invite-role" label="Role">
            <AdminSelect
              id="invite-role"
              aria-label="Invite role"
              value={role}
              disabled={isSaving}
              onChange={setRole}
              options={CMS_ROLE_OPTIONS.map((value) => ({
                value,
                label: formatCmsRole(value),
              }))}
            />
          </EditorField>

          <div className="admin-users-modal-actions">
            <button type="button" className="admin-settings-retry" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="admin-services-create-btn" disabled={isSaving}>
              {isSaving ? (
                <Loader2 size={16} strokeWidth={1.75} className="admin-settings-spinner" />
              ) : (
                <MailPlus size={16} strokeWidth={1.75} />
              )}
              Send invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
