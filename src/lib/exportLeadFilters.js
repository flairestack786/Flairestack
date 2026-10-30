import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatLeadPriority, formatLeadStatus } from './leadsFormat.js'

export const LEAD_EXPORT_COLUMNS = Object.freeze([
  { header: 'Lead ID', key: 'lead_number' },
  { header: 'Name', key: 'full_name' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Company', key: 'company' },
  { header: 'Service', key: 'service_interest' },
  { header: 'Status', key: 'status' },
  { header: 'Priority', key: 'priority' },
  { header: 'Source', key: 'source' },
  { header: 'Message', key: 'message' },
  { header: 'Admin notes', key: 'admin_notes' },
  { header: 'Received', key: 'created_at' },
])

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function asDate(value) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * @param {string} day
 * @param {boolean} endOfDay
 */
function dayBoundary(day, endOfDay) {
  if (!day) return null
  const date = new Date(`${day}T${endOfDay ? '23:59:59.999' : '00:00:00'}`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * @param {Record<string, unknown>[]} leads
 * @param {{
 *   from?: string,
 *   to?: string,
 *   status?: string,
 *   priority?: string,
 *   service?: string,
 * }} filters
 */
export function filterLeadsForExport(leads, filters = {}) {
  const status = filters.status && filters.status !== 'all' ? filters.status : ''
  const priority = filters.priority && filters.priority !== 'all' ? filters.priority : ''
  const service = filters.service && filters.service !== 'all' ? filters.service : ''
  const from = dayBoundary(filters.from || '', false)
  const to = dayBoundary(filters.to || '', true)

  return (Array.isArray(leads) ? leads : []).filter((lead) => {
    if (!lead || typeof lead !== 'object') return false
    if (status && String(lead.status ?? '') !== status) return false
    if (priority && String(lead.priority ?? '') !== priority) return false
    if (service && String(lead.service_interest ?? '') !== service) return false

    if (from || to) {
      const created = asDate(lead.created_at)
      if (!created) return false
      if (from && created < from) return false
      if (to && created > to) return false
    }

    return true
  })
}

/**
 * @param {Record<string, unknown>} lead
 * @param {string} key
 */
export function leadExportCell(lead, key) {
  const raw = lead?.[key]
  if (key === 'status') return formatLeadStatus(String(raw ?? ''))
  if (key === 'priority') return formatLeadPriority(String(raw ?? ''))
  if (key === 'created_at') {
    const date = asDate(raw)
    return date ? date.toLocaleString() : ''
  }
  return raw == null ? '' : String(raw)
}

/**
 * @param {string} value
 */
function csvEscape(value) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/**
 * @param {Record<string, unknown>[]} leads
 */
export function buildLeadsCsv(leads) {
  const header = LEAD_EXPORT_COLUMNS.map((column) => csvEscape(column.header)).join(',')
  const lines = leads.map((lead) =>
    LEAD_EXPORT_COLUMNS.map((column) => csvEscape(leadExportCell(lead, column.key))).join(',')
  )
  return `\uFEFF${[header, ...lines].join('\r\n')}`
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} x
 * @param {number} baseline
 */
function drawFlaireStackLogo(doc, x, baseline) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(10, 10, 10)
  doc.text('FlaireStack', x, baseline)
  const wordWidth = doc.getTextWidth('FlaireStack')
  doc.setFillColor(255, 122, 0)
  doc.roundedRect(x + wordWidth + 3, baseline - 15, 7, 7, 1.2, 1.2, 'F')
}

/**
 * @param {Record<string, unknown>[]} leads
 * @param {string} [summary]
 */
export function createLeadsPdf(leads, summary = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  drawFlaireStackLogo(doc, 32, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)
  const detail =
    summary ||
    `Leads · Exported ${new Date().toLocaleString()} · ${leads.length} lead${leads.length === 1 ? '' : 's'}`
  doc.text(detail, 32, 58)

  autoTable(doc, {
    startY: 74,
    head: [LEAD_EXPORT_COLUMNS.map((column) => column.header)],
    body: leads.map((lead) =>
      LEAD_EXPORT_COLUMNS.map((column) => {
        const value = leadExportCell(lead, column.key)
        return column.key === 'message' || column.key === 'admin_notes' ? value.slice(0, 280) : value
      })
    ),
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [255, 122, 0],
      textColor: [10, 10, 10],
      fontStyle: 'bold',
    },
    margin: { left: 28, right: 28 },
  })

  return doc
}
