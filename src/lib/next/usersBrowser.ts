'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import * as nextAdminApi from '@/lib/next/adminApi'
import {
  CMS_ROLE_OPTIONS,
  CMS_USER_MANAGEABLE_STATUS_OPTIONS,
  INVALID_MANAGEABLE_STATUS_MESSAGE,
  SELF_ACCOUNT_LOCKOUT_MESSAGE,
  summarizeTeam,
} from '@/lib/usersFormat'

const PROFILE_SELECT =
  'id, email, full_name, avatar_path, role, status, permissions, invited_at, invited_by, last_sign_in_at, notes, created_at, updated_at'

const INVITE_SELECT =
  'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, accepted_at, accepted_user_id, metadata, created_at, updated_at'

const PROFILE_UPDATE_FIELDS = [
  'full_name',
  'avatar_path',
  'role',
  'status',
  'permissions',
  'notes',
] as const

const ROLES = new Set(CMS_ROLE_OPTIONS)
const MANAGEABLE_STATUSES = new Set(CMS_USER_MANAGEABLE_STATUS_OPTIONS)

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function pickFields(fields: Record<string, unknown>, allowed: readonly string[]) {
  const payload: Record<string, unknown> = {}

  for (const key of allowed) {
    if (fields[key] === undefined) continue
    const value = fields[key]

    if (key === 'role') {
      const role = asTrimmedString(value)
      if (!ROLES.has(role as (typeof CMS_ROLE_OPTIONS)[number])) {
        throw new Error(`Invalid role "${role}".`)
      }
      payload[key] = role
      continue
    }

    if (key === 'status') {
      const status = asTrimmedString(value)
      if (!MANAGEABLE_STATUSES.has(status as 'active' | 'disabled')) {
        throw new Error(INVALID_MANAGEABLE_STATUS_MESSAGE)
      }
      payload[key] = status
      continue
    }

    if (typeof value === 'string') {
      payload[key] = value.trim()
      continue
    }

    payload[key] = value
  }

  return payload
}

export async function listUsers() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

export async function listUserInvites() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('user_invites')
    .select(INVITE_SELECT)
    .order('invited_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

export async function getUser(id: string) {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Record<string, unknown>
}

export async function fetchUsersSnapshot() {
  const [users, invites] = await Promise.all([listUsers(), listUserInvites()])
  const pendingInvites = invites.filter((invite) => invite.status === 'pending')

  return {
    users,
    invites,
    pendingInvites,
    summary: summarizeTeam(users, invites),
  }
}

export async function updateUser(id: string, fields: Record<string, unknown>) {
  const supabase = getSupabaseBrowser()
  const payload = pickFields(fields, PROFILE_UPDATE_FIELDS)
  const { role, ...rest } = payload

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id && String(id) === String(user.id)) {
    if (rest.status === 'disabled') {
      throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
    }
    if (role !== undefined) {
      throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
    }
  }

  if (user?.id) {
    rest.updated_by = user.id
  }

  let updated: Record<string, unknown> | null = null

  if (role !== undefined) {
    const result = await nextAdminApi.syncUserRoleAuth(id, String(role))
    updated = (result?.user as Record<string, unknown> | undefined) ?? null
  }

  if (Object.keys(rest).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(rest)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) {
      throw new Error('User update affected 0 rows (check RLS policies).')
    }
    updated = data as Record<string, unknown>
  }

  if (!updated) {
    return getUser(id)
  }

  return updated
}

export async function setUserStatus(id: string, status: string) {
  const supabase = getSupabaseBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (status === 'disabled' && user?.id && String(id) === String(user.id)) {
    throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
  }

  if (status !== 'active' && status !== 'disabled') {
    throw new Error(INVALID_MANAGEABLE_STATUS_MESSAGE)
  }

  if (status === 'disabled') {
    const result = await nextAdminApi.disableUserAuth(id)
    if (!result?.user) throw new Error('Disable user failed.')
    return result.user as Record<string, unknown>
  }

  const result = await nextAdminApi.enableUserAuth(id)
  if (!result?.user) throw new Error('Enable user failed.')
  return result.user as Record<string, unknown>
}

export async function createUserInvite(input: {
  email?: string
  full_name?: string
  fullName?: string
  role?: string
} = {}) {
  const email = asTrimmedString(input.email)
  const full_name = asTrimmedString(input.full_name ?? input.fullName)
  const role =
    input.role === 'editor' ? 'editor' : input.role === 'sales' ? 'sales' : 'administrator'

  if (!email) {
    throw new Error('Invite email is required.')
  }

  const result = await nextAdminApi.sendUserInvite({
    email,
    full_name: full_name || undefined,
    role,
  })

  if (!result?.invite) throw new Error('Invite creation failed.')
  return result.invite as Record<string, unknown>
}

export async function revokeUserInvite(id: string) {
  const result = await nextAdminApi.revokeUserInviteAuth(id)
  if (!result?.invite) throw new Error('Revoke invite failed.')
  return result.invite as Record<string, unknown>
}

export async function resendInvite(id: string) {
  const result = await nextAdminApi.resendUserInvite(id)
  if (!result?.invite) throw new Error('Resend invite failed.')
  return result.invite as Record<string, unknown>
}

export async function requestPasswordReset(userId: string) {
  return nextAdminApi.sendPasswordReset(userId)
}

/** Media public URL via Next browser client (no Vite supabase import). */
export function getAvatarPublicUrl(path: string) {
  if (!path) throw new Error('getAvatarPublicUrl requires a storage path.')
  const supabase = getSupabaseBrowser()
  const { data } = supabase.storage.from('site-media').getPublicUrl(path)
  return data.publicUrl
}

/** API object for shared UserDetailDrawer on Next. */
export const nextUserDrawerApi = {
  updateUser,
  setUserStatus,
  requestPasswordReset,
}

/** API object for InviteUserModal on Next. */
export const nextInviteModalApi = {
  createUserInvite,
}
