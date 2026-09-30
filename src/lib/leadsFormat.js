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
