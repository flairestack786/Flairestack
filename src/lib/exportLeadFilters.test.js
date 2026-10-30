import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLeadsCsv, createLeadsPdf, filterLeadsForExport } from './exportLeadFilters.js'

const leads = [
  {
    lead_number: 'FS-1',
    full_name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '111',
    company: 'Analytical',
    service_interest: 'Web Development',
    status: 'new',
    priority: 'high',
    source: 'contact_form',
    message: 'Hello, "world"',
    admin_notes: '',
    created_at: '2026-10-01T15:00:00.000Z',
  },
  {
    lead_number: 'FS-2',
    full_name: 'Grace Hopper',
    email: 'grace@example.com',
    service_interest: 'Cloud Strategy',
    status: 'won',
    priority: 'low',
    message: 'Later lead',
    created_at: '2026-10-20T15:00:00.000Z',
  },
  {
    lead_number: 'FS-3',
    full_name: 'No Date',
    status: 'new',
    priority: 'high',
    service_interest: 'Web Development',
    created_at: '',
  },
]

test('date range keeps leads received inside the inclusive days', () => {
  const rows = filterLeadsForExport(leads, { from: '2026-10-01', to: '2026-10-10' })
  assert.deepEqual(
    rows.map((row) => row.lead_number),
    ['FS-1']
  )
})

test('status, priority, and service filters combine', () => {
  const rows = filterLeadsForExport(leads, {
    status: 'new',
    priority: 'high',
    service: 'Web Development',
  })
  assert.deepEqual(
    rows.map((row) => row.lead_number),
    ['FS-1', 'FS-3']
  )
})

test('a date range excludes leads with no received date', () => {
  const rows = filterLeadsForExport(leads, { from: '2026-10-01', to: '2026-10-31', status: 'new' })
  assert.deepEqual(
    rows.map((row) => row.lead_number),
    ['FS-1']
  )
})

test('csv includes the header, escapes quotes, and omits filtered leads', () => {
  const rows = filterLeadsForExport(leads, { status: 'won' })
  const csv = buildLeadsCsv(rows)
  assert.match(csv, /^﻿Lead ID,Name,Email/)
  assert.match(csv, /FS-2,Grace Hopper,grace@example.com/)
  assert.equal(csv.includes('FS-1'), false)
  assert.equal(csv.includes('Ada Lovelace'), false)
})

test('csv escapes embedded quotes in the message', () => {
  const csv = buildLeadsCsv(filterLeadsForExport(leads, { from: '2026-10-01', to: '2026-10-01' }))
  assert.match(csv, /"Hello, ""world"""/)
})

test('pdf starts with a PDF document and includes the lead id', () => {
  const doc = createLeadsPdf(filterLeadsForExport(leads, { status: 'won' }), 'Leads · test')
  const output = doc.output()
  assert.match(output, /^%PDF/)
  assert.match(output, /FlaireStack/)
  assert.match(output, /FS-2/)
  assert.equal(output.includes('FS-1'), false)
})
