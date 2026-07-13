import { supabase } from './supabase'

/** @typedef {'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'archived'} LeadStatus */
/** @typedef {'low' | 'medium' | 'high' | 'urgent'} LeadPriority */
/** @typedef {'created' | 'status_changed' | 'priority_changed' | 'note' | 'assignment_changed' | 'email' | 'call' | 'system'} LeadTimelineEventType */

/** @type {readonly LeadStatus[]} */
export const LEAD_STATUS_OPTIONS = Object.freeze([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
  'archived',
])

/** @type {readonly LeadPriority[]} */
export const LEAD_PRIORITY_OPTIONS = Object.freeze(['low', 'medium', 'high', 'urgent'])

const LEAD_STATUSES = new Set(LEAD_STATUS_OPTIONS)
const LEAD_PRIORITIES = new Set(LEAD_PRIORITY_OPTIONS)

/**
 * @param {string} status
 * @returns {string}
 */
export function formatLeadStatus(status) {
  return String(status ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * @param {string} priority
 * @returns {string}
 */
export function formatLeadPriority(priority) {
  return formatLeadStatus(priority)
}

const PUBLIC_INSERT_FIELDS = [
  'full_name',
  'email',
  'phone',
  'company',
  'service_interest',
  'service_id',
  'message',
  'source',
  'metadata',
]

const ADMIN_UPDATE_FIELDS = [
  'full_name',
  'email',
  'phone',
  'company',
  'service_interest',
  'service_id',
  'message',
  'status',
  'priority',
  'source',
  'admin_notes',
  'assigned_to',
  'metadata',
  'contacted_at',
  'closed_at',
]

/**
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {Record<string, unknown>} fields
 * @param {string[]} allowed
 * @returns {Record<string, unknown>}
 */
function pickFields(fields, allowed) {
  /** @type {Record<string, unknown>} */
  const payload = {}

  for (const key of allowed) {
    if (fields[key] === undefined) continue
    const value = fields[key]

    if (key === 'status') {
      const status = asTrimmedString(value)
      if (!LEAD_STATUSES.has(status)) {
        throw new Error(`Invalid lead status "${status}".`)
      }
      payload[key] = status
      continue
    }

    if (key === 'priority') {
      const priority = asTrimmedString(value)
      if (!LEAD_PRIORITIES.has(priority)) {
        throw new Error(`Invalid lead priority "${priority}".`)
      }
      payload[key] = priority
      continue
    }

    if (key === 'service_id' || key === 'assigned_to') {
      const id = asTrimmedString(value)
      payload[key] = id === '' ? null : id
      continue
    }

    if (key === 'metadata') {
      payload[key] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {}
      continue
    }

    if (key === 'contacted_at' || key === 'closed_at') {
      payload[key] = value || null
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

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select(
      'id, lead_number, full_name, email, phone, company, service_interest, service_id, message, status, priority, source, admin_notes, assigned_to, contacted_at, closed_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} id
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getLead(id) {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()

  if (error) throw error
  return data
}

/**
 * @param {string} leadNumber
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getLeadByNumber(leadNumber) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_number', leadNumber)
    .single()

  if (error) throw error
  return data
}

/**
 * Public / contact-form insert. Does not return the row (anon has no SELECT).
 * @param {Partial<Record<string, unknown>>} input
 * @returns {Promise<void>}
 */
export async function createPublicLead(input = {}) {
  const payload = pickFields(
    {
      full_name: input.full_name ?? input.fullName ?? '',
      email: input.email ?? '',
      phone: input.phone ?? '',
      company: input.company ?? '',
      service_interest: input.service_interest ?? input.service ?? '',
      service_id: input.service_id ?? null,
      message: input.message ?? '',
      source: input.source ?? 'contact_form',
      metadata: input.metadata ?? {},
      status: 'new',
      priority: 'medium',
    },
    [...PUBLIC_INSERT_FIELDS, 'status', 'priority']
  )

  if (!asTrimmedString(payload.full_name)) {
    throw new Error('Full name is required.')
  }
  if (!asTrimmedString(payload.email)) {
    throw new Error('Email is required.')
  }

  const { error } = await supabase.from('leads').insert(payload)
  if (error) throw error
}

/**
 * Admin create (returns the created row including generated lead_number).
 * @param {Partial<Record<string, unknown>>} input
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createLead(input = {}) {
  const payload = pickFields(
    {
      full_name: input.full_name ?? 'New Lead',
      email: input.email ?? 'lead@example.com',
      phone: input.phone ?? '',
      company: input.company ?? '',
      service_interest: input.service_interest ?? '',
      service_id: input.service_id ?? null,
      message: input.message ?? '',
      status: input.status ?? 'new',
      priority: input.priority ?? 'medium',
      source: input.source ?? 'admin',
      admin_notes: input.admin_notes ?? null,
      assigned_to: input.assigned_to ?? null,
      metadata: input.metadata ?? {},
    },
    ADMIN_UPDATE_FIELDS
  )

  const { data, error } = await supabase.from('leads').insert(payload).select().single()

  if (error) throw error
  return data
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} fields
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateLead(id, fields) {
  const payload = pickFields(fields, ADMIN_UPDATE_FIELDS)

  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Lead update affected 0 rows (check RLS policies).')
  }
  return data
}

/**
 * @param {string} id
 * @param {LeadStatus} status
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setLeadStatus(id, status) {
  if (!LEAD_STATUSES.has(status)) {
    throw new Error(`Invalid lead status "${status}".`)
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Status update affected 0 rows (check RLS policies).')
  }
  return data
}

/**
 * @param {string} id
 * @param {LeadPriority} priority
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setLeadPriority(id, priority) {
  if (!LEAD_PRIORITIES.has(priority)) {
    throw new Error(`Invalid lead priority "${priority}".`)
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ priority })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Priority update affected 0 rows (check RLS policies).')
  }
  return data
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

/**
 * @param {Record<string, unknown>} event
 * @returns {string}
 */
export function formatLeadTimelineSummary(event) {
  const type = String(event.event_type ?? '')
  if (type === 'status_changed') {
    return `${formatLeadStatus(String(event.old_value ?? ''))} → ${formatLeadStatus(String(event.new_value ?? ''))}`
  }
  if (type === 'priority_changed') {
    return `${formatLeadPriority(String(event.old_value ?? ''))} → ${formatLeadPriority(String(event.new_value ?? ''))}`
  }
  if (type === 'note') {
    return String(event.body ?? '')
  }
  if (type === 'created') {
    return String(event.body || 'Lead created')
  }
  return String(event.body || event.title || type)
}

/**
 * @param {number} [limit]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listRecentLeadTimeline(limit = 15) {
  const { data, error } = await supabase
    .from('lead_timeline')
    .select(
      'id, lead_id, event_type, title, body, old_value, new_value, created_at, leads ( lead_number, full_name )'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} leadId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listLeadTimeline(leadId) {
  const { data, error } = await supabase
    .from('lead_timeline')
    .select('id, lead_id, event_type, title, body, old_value, new_value, metadata, created_by, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} leadId
 * @param {{
 *   event_type?: LeadTimelineEventType,
 *   title?: string,
 *   body?: string,
 *   metadata?: Record<string, unknown>,
 * }} input
 * @returns {Promise<Record<string, unknown>>}
 */
export async function addLeadTimelineNote(leadId, input = {}) {
  const body = asTrimmedString(input.body)
  if (!body) {
    throw new Error('Timeline note body is required.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('lead_timeline')
    .insert({
      lead_id: leadId,
      event_type: input.event_type ?? 'note',
      title: asTrimmedString(input.title) || 'Note',
      body,
      metadata: input.metadata ?? {},
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
