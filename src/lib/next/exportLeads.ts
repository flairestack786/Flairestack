import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatLeadPriority, formatLeadStatus } from '@/lib/leadsFormat'

const COLUMNS: Array<{ header: string; key: string }> = [
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
]

function stamp() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function cellValue(lead: Record<string, unknown>, key: string) {
  const raw = lead[key]
  if (key === 'status') return formatLeadStatus(String(raw ?? ''))
  if (key === 'priority') return formatLeadPriority(String(raw ?? ''))
  if (key === 'created_at') {
    if (!raw) return ''
    const date = new Date(String(raw))
    if (Number.isNaN(date.getTime())) return String(raw)
    return date.toLocaleString()
  }
  return raw == null ? '' : String(raw)
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportLeadsCsv(leads: Record<string, unknown>[]) {
  const header = COLUMNS.map((column) => csvEscape(column.header)).join(',')
  const lines = leads.map((lead) =>
    COLUMNS.map((column) => csvEscape(cellValue(lead, column.key))).join(',')
  )
  const csv = `\uFEFF${[header, ...lines].join('\r\n')}`
  downloadBlob(
    `flairestack-leads-${stamp()}.csv`,
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  )
}

export function exportLeadsPdf(leads: Record<string, unknown>[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(14)
  doc.text('FlaireStack leads', 32, 36)
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(`Exported ${new Date().toLocaleString()} · ${leads.length} lead${leads.length === 1 ? '' : 's'}`, 32, 52)

  autoTable(doc, {
    startY: 66,
    head: [COLUMNS.map((column) => column.header)],
    body: leads.map((lead) =>
      COLUMNS.map((column) => {
        const value = cellValue(lead, column.key)
        return column.key === 'message' || column.key === 'admin_notes'
          ? value.slice(0, 280)
          : value
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

  doc.save(`flairestack-leads-${stamp()}.pdf`)
}
