import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Inbox,
  Loader2,
  Mail,
  MailPlus,
  PenLine,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'
import StatsCard from '../../components/admin/dashboard/StatsCard'
import UserDetailDrawer from '../../components/admin/users/UserDetailDrawer'
import InviteUserModal from '../../components/admin/users/InviteUserModal'
import UserAvatar from '../../components/admin/users/UserAvatar'
import InviteStatusBadge from '../../components/admin/users/InviteStatusBadge'
import ConfirmationModal from '../../components/admin/ConfirmationModal'
import {
  fetchUsersSnapshot,
  formatCmsRole,
  formatCmsUserStatus,
  getInviteLastEmailSentAt,
  resendInvite,
  revokeUserInvite,
  summarizeTeam,
} from '../../lib/users'
import { useToast } from '../../components/common/ToastProvider'

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'administrators', label: 'Administrators' },
  { id: 'editors', label: 'Editors' },
  { id: 'sales', label: 'Sales' },
]

const POLL_MS = 8000
const ACCEPTED_HOLD_MS = 12000

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * @param {unknown} value
 * @returns {string}
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
 * @param {Record<string, unknown>[]} users
 * @param {string | null | undefined} invitedBy
 */
function resolveInviterName(users, invitedBy) {
  if (!invitedBy) return '—'
  const match = users.find((user) => String(user.id) === String(invitedBy))
  if (!match) return 'Administrator'
  return String(match.full_name || match.email || 'Administrator')
}

export default function AdminUsersPage() {
  const { success, error } = useToast()
  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [users, setUsers] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [invites, setInvites] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingInvites: 0,
    administrators: 0,
    editors: 0,
    sales: 0,
    disabledUsers: 0,
  })
  const [resendingInviteId, setResendingInviteId] = useState('')
  const [revokingInviteId, setRevokingInviteId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(/** @type {Record<string, unknown> | null} */ (null))

  const knownPendingIdsRef = useRef(/** @type {Set<string>} */ (new Set()))
  const toastedAcceptedRef = useRef(/** @type {Set<string>} */ (new Set()))

  const applySnapshot = useCallback(
    (snapshot, { announceAccepted = false } = {}) => {
      const nextUsers = snapshot.users
      const nextInvites = snapshot.pendingInvites
      const nextPendingIds = new Set(
        nextInvites.filter((invite) => invite.status === 'pending').map((invite) => String(invite.id))
      )

      if (announceAccepted) {
        for (const invite of nextInvites) {
          const id = String(invite.id)
          if (
            invite.status === 'accepted' &&
            knownPendingIdsRef.current.has(id) &&
            !toastedAcceptedRef.current.has(id)
          ) {
            toastedAcceptedRef.current.add(id)
            success('Invitation accepted. User is now active.')
          }
        }
      }

      knownPendingIdsRef.current = nextPendingIds
      setUsers(nextUsers)
      setInvites(nextInvites)
      setSummary(snapshot.summary)
    },
    [success]
  )

  const loadUsers = useCallback(
    async ({ silent = false, announceAccepted = false } = {}) => {
      if (!silent) {
        setStatus('loading')
        setLoadError('')
      }

      try {
        const snapshot = await fetchUsersSnapshot()
        applySnapshot(snapshot, { announceAccepted })
        setStatus('ready')
      } catch (err) {
        if (!silent) {
          setLoadError(err?.message ?? 'Failed to load users.')
          setStatus('error')
        }
      }
    },
    [applySnapshot]
  )

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (status !== 'ready') return undefined
    const hasPending = invites.some((invite) => invite.status === 'pending')
    if (!hasPending) return undefined

    const timer = window.setInterval(() => {
      loadUsers({ silent: true, announceAccepted: true })
    }, POLL_MS)

    return () => window.clearInterval(timer)
  }, [status, invites, loadUsers])

  useEffect(() => {
    const accepted = invites.filter((invite) => invite.status === 'accepted')
    if (accepted.length === 0) return undefined

    const timer = window.setTimeout(() => {
      setInvites((current) => {
        const next = current.filter((invite) => invite.status !== 'accepted')
        setUsers((usersCurrent) => {
          setSummary(summarizeTeam(usersCurrent, next))
          return usersCurrent
        })
        return next
      })
    }, ACCEPTED_HOLD_MS)

    return () => window.clearTimeout(timer)
  }, [invites])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return users.filter((user) => {
      if (quickFilter === 'active' && user.status !== 'active') return false
      if (quickFilter === 'pending' && user.status !== 'invited') return false
      if (quickFilter === 'disabled' && user.status !== 'disabled') return false
      if (quickFilter === 'administrators' && user.role !== 'administrator') return false
      if (quickFilter === 'editors' && user.role !== 'editor') return false
      if (quickFilter === 'sales' && user.role !== 'sales') return false

      if (!query) return true

      const haystack = [user.email, user.full_name, user.role, user.status, user.notes]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ')

      return haystack.includes(query)
    })
  }, [users, searchQuery, quickFilter])

  const handleOpenUser = useCallback((user) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleUserUpdated = useCallback((updated) => {
    setUsers((current) => {
      const nextUsers = current.map((row) =>
        row.id === updated.id ? { ...row, ...updated } : row
      )
      setInvites((currentInvites) => {
        setSummary(summarizeTeam(nextUsers, currentInvites))
        return currentInvites
      })
      return nextUsers
    })
    setSelectedUser((current) =>
      current && current.id === updated.id ? { ...current, ...updated } : current
    )
  }, [])

  const handleInviteCreated = useCallback((invite) => {
    setInvites((current) => {
      const nextInvites = [invite, ...current.filter((row) => row.id !== invite.id)]
      knownPendingIdsRef.current.add(String(invite.id))
      setUsers((usersCurrent) => {
        setSummary(summarizeTeam(usersCurrent, nextInvites))
        return usersCurrent
      })
      return nextInvites
    })
  }, [])

  const handleConfirmRevoke = useCallback(async () => {
    if (!revokeTarget) return
    const inviteId = String(revokeTarget.id)
    setRevokingInviteId(inviteId)
    try {
      const updated = await revokeUserInvite(inviteId)
      setInvites((current) => {
        const nextInvites = current.map((invite) =>
          String(invite.id) === inviteId ? { ...invite, ...updated, status: 'revoked' } : invite
        )
        setUsers((usersCurrent) => {
          setSummary(summarizeTeam(usersCurrent, nextInvites))
          return usersCurrent
        })
        return nextInvites
      })
      knownPendingIdsRef.current.delete(inviteId)
      success('Invitation revoked.')
      setRevokeTarget(null)

      window.setTimeout(() => {
        setInvites((current) => {
          const nextInvites = current.filter((invite) => String(invite.id) !== inviteId)
          setUsers((usersCurrent) => {
            setSummary(summarizeTeam(usersCurrent, nextInvites))
            return usersCurrent
          })
          return nextInvites
        })
      }, 4000)
    } catch (err) {
      error(err?.message ?? 'Failed to revoke invite.')
    } finally {
      setRevokingInviteId('')
    }
  }, [revokeTarget, success, error])

  const handleResendInvite = useCallback(
    async (inviteId) => {
      setResendingInviteId(inviteId)
      try {
        const invite = await resendInvite(inviteId)
        setInvites((current) =>
          current.map((row) => (String(row.id) === inviteId ? { ...row, ...invite } : row))
        )
        success('Invitation email resent.')
      } catch (err) {
        error(err?.message ?? 'Failed to resend invite.')
      } finally {
        setResendingInviteId('')
      }
    },
    [success, error]
  )

  const hasActiveFilters = searchQuery.trim() !== '' || quickFilter !== 'all'
  const pendingCount = invites.filter((invite) => invite.status === 'pending').length

  return (
    <div className="admin-page admin-services-page admin-users-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Users size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-desc">
            Manage CMS access, invitations, and team roles.
          </p>
        </div>
        <div className="admin-users-header-actions">
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => loadUsers()}
            disabled={status === 'loading'}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            className="admin-services-create-btn"
            onClick={() => setInviteOpen(true)}
          >
            <MailPlus size={16} strokeWidth={1.75} aria-hidden />
            Invite user
          </button>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading users…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={() => loadUsers()}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="admin-users-summary" aria-label="User summary">
            <StatsCard
              label="Total Users"
              value={summary.totalUsers}
              hint="All CMS profiles"
              icon={<Users size={18} strokeWidth={1.75} />}
              variant="users"
            />
            <StatsCard
              label="Active"
              value={summary.activeUsers}
              hint="Currently enabled"
              icon={<UserCheck size={18} strokeWidth={1.75} />}
              variant="won"
            />
            <StatsCard
              label="Pending"
              value={summary.pendingInvites}
              hint="Awaiting acceptance"
              icon={<Mail size={18} strokeWidth={1.75} />}
              variant="today"
            />
            <StatsCard
              label="Admins"
              value={summary.administrators}
              hint="Full access"
              icon={<Shield size={18} strokeWidth={1.75} />}
              variant="leads"
              className="admin-users-stat--admin"
            />
            <StatsCard
              label="Editors"
              value={summary.editors}
              hint="Content access"
              icon={<PenLine size={18} strokeWidth={1.75} />}
              variant="services"
            />
            <StatsCard
              label="Sales"
              value={summary.sales}
              hint="Leads access"
              icon={<Inbox size={18} strokeWidth={1.75} />}
              variant="testimonials"
              className="admin-users-stat--sales"
            />
          </div>

          <div className="admin-users-toolbar">
            <label className="admin-leads-search admin-users-search">
              <Search size={16} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Search users</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, email, role…"
                className="admin-settings-input"
              />
            </label>

            <div className="admin-users-filter-chips" role="group" aria-label="Quick filters">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`admin-users-chip${quickFilter === filter.id ? ' is-active' : ''}`}
                  aria-pressed={quickFilter === filter.id}
                  onClick={() => setQuickFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <section className="admin-users-panel" aria-label="Team members">
            <div className="admin-services-table-wrap admin-users-table-wrap">
              {users.length === 0 ? (
                <div className="admin-page-placeholder admin-leads-empty">
                  <Users size={28} strokeWidth={1.5} aria-hidden />
                  <p>No team members yet</p>
                  <p className="admin-leads-empty-hint">
                    Invite your first administrator, editor, or sales teammate to collaborate in the CMS.
                  </p>
                  <button
                    type="button"
                    className="admin-services-create-btn"
                    onClick={() => setInviteOpen(true)}
                  >
                    <MailPlus size={16} strokeWidth={1.75} />
                    Invite user
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="admin-page-placeholder admin-leads-empty">
                  <Search size={28} strokeWidth={1.5} aria-hidden />
                  <p>No users match this filter</p>
                  <p className="admin-leads-empty-hint">
                    Try another chip or clear search to see the full team list.
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="admin-settings-retry"
                      onClick={() => {
                        setSearchQuery('')
                        setQuickFilter('all')
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="admin-services-table admin-leads-table admin-users-table">
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Last login</th>
                      <th scope="col">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={String(user.id)}
                        className="admin-leads-row"
                        tabIndex={0}
                        onClick={() => handleOpenUser(user)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleOpenUser(user)
                          }
                        }}
                      >
                        <td>
                          <div className="admin-users-person">
                            <UserAvatar
                              fullName={String(user.full_name ?? '')}
                              email={String(user.email ?? '')}
                              avatarPath={user.avatar_path ? String(user.avatar_path) : null}
                            />
                            <div className="admin-leads-person">
                              <span className="admin-leads-person-name">
                                {String(user.full_name || '—')}
                              </span>
                              <span className="admin-leads-person-email">
                                {String(user.email ?? '')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-users-badge admin-users-badge--role-${user.role}`}>
                            {formatCmsRole(String(user.role ?? ''))}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-users-badge admin-users-badge--status-${user.status}`}
                          >
                            {formatCmsUserStatus(String(user.status ?? ''))}
                          </span>
                        </td>
                        <td className="admin-users-date-cell">{formatDateTime(user.last_sign_in_at)}</td>
                        <td className="admin-users-date-cell">{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredUsers.length > 0 && (
              <p className="admin-users-count" aria-live="polite">
                Showing {filteredUsers.length} of {users.length} user
                {users.length === 1 ? '' : 's'}
              </p>
            )}
          </section>

          <section className="admin-users-invites" aria-label="Pending invitations">
            <header className="admin-users-invites-header">
              <div>
                <h2 className="admin-dashboard-card-title">Pending invitations</h2>
                <p className="admin-dashboard-card-desc">
                  Track invitation delivery, acceptance, and revocation status.
                  {pendingCount > 0 ? ` ${pendingCount} awaiting acceptance.` : ''}
                </p>
              </div>
            </header>

            <div className="admin-services-table-wrap admin-users-table-wrap">
              {invites.length === 0 ? (
                <div className="admin-page-placeholder admin-leads-empty admin-users-invites-empty">
                  <Mail size={28} strokeWidth={1.5} aria-hidden />
                  <p>No pending invitations</p>
                  <p className="admin-leads-empty-hint">
                    When you invite someone, their status and email timeline will appear here.
                  </p>
                </div>
              ) : (
                <table className="admin-services-table admin-leads-table admin-users-invites-table">
                  <thead>
                    <tr>
                      <th scope="col">Invitee</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Details</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => {
                      const inviteId = String(invite.id)
                      const isPending = invite.status === 'pending'
                      const isResending = resendingInviteId === inviteId
                      const inviteName = String(invite.full_name || '').trim()
                      const inviteEmail = String(invite.email ?? '')

                      return (
                        <tr key={inviteId}>
                          <td>
                            <div className="admin-leads-person">
                              <span className="admin-leads-person-name">
                                {inviteName || inviteEmail || '—'}
                              </span>
                              {inviteName ? (
                                <span className="admin-leads-person-email">{inviteEmail}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`admin-users-badge admin-users-badge--role-${invite.role}`}
                            >
                              {formatCmsRole(String(invite.role ?? ''))}
                            </span>
                          </td>
                          <td>
                            <InviteStatusBadge status={String(invite.status ?? 'pending')} />
                          </td>
                          <td>
                            <dl className="admin-users-invite-details">
                              <div>
                                <dt>Invited by</dt>
                                <dd>{resolveInviterName(users, invite.invited_by)}</dd>
                              </div>
                              <div>
                                <dt>Sent</dt>
                                <dd>{formatDateTime(invite.invited_at)}</dd>
                              </div>
                              <div>
                                <dt>Last email</dt>
                                <dd>{formatDateTime(getInviteLastEmailSentAt(invite))}</dd>
                              </div>
                              <div>
                                <dt>Expires</dt>
                                <dd>{formatDate(invite.expires_at)}</dd>
                              </div>
                            </dl>
                          </td>
                          <td>
                            <div className="admin-users-invite-actions">
                              <button
                                type="button"
                                className="admin-users-action-btn"
                                disabled={!isPending || isResending || revokingInviteId === inviteId}
                                onClick={() => handleResendInvite(inviteId)}
                              >
                                {isResending ? (
                                  <Loader2
                                    size={14}
                                    strokeWidth={1.75}
                                    className="admin-settings-spinner"
                                  />
                                ) : (
                                  <RefreshCw size={14} strokeWidth={1.75} />
                                )}
                                Resend
                              </button>
                              <button
                                type="button"
                                className="admin-users-action-btn admin-users-action-btn--danger"
                                disabled={!isPending || isResending || revokingInviteId === inviteId}
                                onClick={() => setRevokeTarget(invite)}
                              >
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}

      <UserDetailDrawer
        user={selectedUser}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onUserUpdated={handleUserUpdated}
      />

      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={handleInviteCreated}
      />

      <ConfirmationModal
        isOpen={Boolean(revokeTarget)}
        title="Revoke invitation?"
        message="This cancels the pending invite. The recipient will no longer be able to accept it, and any unused auth invite will be removed."
        itemName={String(revokeTarget?.email ?? '')}
        confirmLabel="Revoke invite"
        isLoading={Boolean(revokingInviteId)}
        onConfirm={handleConfirmRevoke}
        onCancel={() => {
          if (!revokingInviteId) setRevokeTarget(null)
        }}
      />
    </div>
  )
}
