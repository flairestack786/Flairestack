import { buildLeadsCsv, createLeadsPdf } from '@/lib/exportLeadFilters'

function stamp() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
  downloadBlob(
    `flairestack-leads-${stamp()}.csv`,
    new Blob([buildLeadsCsv(leads)], { type: 'text/csv;charset=utf-8' })
  )
}

export function exportLeadsPdf(leads: Record<string, unknown>[], summary?: string) {
  const doc = createLeadsPdf(
    leads,
    summary ||
      `Leads · Exported ${new Date().toLocaleString()} · ${leads.length} lead${leads.length === 1 ? '' : 's'}`
  )
  doc.save(`flairestack-leads-${stamp()}.pdf`)
}
