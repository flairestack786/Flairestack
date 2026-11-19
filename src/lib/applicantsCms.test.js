import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  adminNavItems,
  findActiveNavItemId,
  getNavSectionsForRole,
} from '../data/adminNav.js'
import {
  clampPage,
  filterJobSummaries,
  labelEmploymentType,
  normalizeJobSummary,
  pageCount,
  readEmbeddedCount,
  readProfileLinks,
  resumeSizeLabel,
  resumeTypeLabel,
  searchTokens,
  sortJobSummaries,
} from './applicantsCms.js'
import { canAccessModule, canAccessPath } from './cmsPermissions.js'
import { JOB_APPLICATION_STATUSES } from './jobApplicationValidation.js'

const row = (over = {}) => ({
  id: 'j1',
  title: 'Frontend Engineer',
  slug: 'frontend-engineer',
  employment_type: 'full_time',
  location: 'Remote',
  status: 'published',
  total: [{ count: 0 }],
  new_count: [{ count: 0 }],
  last: [],
  ...over,
})

test('counts come from the embedded aggregate; a job with zero applicants is kept', () => {
  const zero = normalizeJobSummary(row())
  assert.equal(zero.totalApplicants, 0)
  assert.equal(zero.newApplicants, 0)
  assert.equal(zero.lastApplicationAt, null)

  const busy = normalizeJobSummary(
    row({
      total: [{ count: 7 }],
      new_count: [{ count: 3 }],
      last: [{ created_at: '2026-11-17T10:00:00Z' }],
    })
  )
  assert.equal(busy.totalApplicants, 7)
  assert.equal(busy.newApplicants, 3)
  assert.equal(busy.lastApplicationAt, '2026-11-17T10:00:00Z')
})

test('malformed or missing embeds degrade to zero instead of crashing', () => {
  assert.equal(readEmbeddedCount(undefined), 0)
  assert.equal(readEmbeddedCount([]), 0)
  assert.equal(readEmbeddedCount([{ count: 'x' }]), 0)
  assert.equal(readEmbeddedCount([{ count: -4 }]), 0)
  const summary = normalizeJobSummary({ id: 'x' })
  assert.equal(summary.title, 'Untitled role')
  assert.equal(summary.totalApplicants, 0)
})

test('"new" can never exceed the total', () => {
  const s = normalizeJobSummary(row({ total: [{ count: 2 }], new_count: [{ count: 5 }] }))
  assert.equal(s.newApplicants, 2)
})

const jobs = [
  normalizeJobSummary(row({ id: 'a', title: 'Alpha', total: [{ count: 1 }], last: [{ created_at: '2026-01-01T00:00:00Z' }] })),
  normalizeJobSummary(row({ id: 'b', title: 'Beta', employment_type: 'contract', status: 'closed', total: [{ count: 9 }], last: [{ created_at: '2026-06-01T00:00:00Z' }] })),
  normalizeJobSummary(row({ id: 'c', title: 'Gamma' })),
  normalizeJobSummary(row({ id: 'd', title: 'Delta intern', employment_type: 'internship', total: [{ count: 4 }], last: [{ created_at: '2026-03-01T00:00:00Z' }] })),
]

test('search by job title and filters by type / posting status', () => {
  assert.deepEqual(filterJobSummaries(jobs, { query: 'alp' }).map((j) => j.id), ['a'])
  assert.deepEqual(filterJobSummaries(jobs, { query: 'INTERN' }).map((j) => j.id), ['d'])
  assert.deepEqual(filterJobSummaries(jobs, { employmentType: 'contract' }).map((j) => j.id), ['b'])
  assert.deepEqual(filterJobSummaries(jobs, { jobStatus: 'closed' }).map((j) => j.id), ['b'])
  assert.equal(filterJobSummaries(jobs, { employmentType: 'all', jobStatus: 'all' }).length, 4)
  assert.equal(filterJobSummaries(jobs, { query: 'nope' }).length, 0)
})

test('sort by most recent application keeps zero-applicant jobs last', () => {
  assert.deepEqual(sortJobSummaries(jobs, 'recent').map((j) => j.id), ['b', 'd', 'a', 'c'])
})

test('sort by applicant count, ascending and descending, with a stable tie-break', () => {
  assert.deepEqual(sortJobSummaries(jobs, 'count_desc').map((j) => j.id), ['b', 'd', 'a', 'c'])
  assert.deepEqual(sortJobSummaries(jobs, 'count_asc').map((j) => j.id), ['c', 'a', 'd', 'b'])
  assert.deepEqual(sortJobSummaries(jobs, 'title').map((j) => j.id), ['a', 'b', 'd', 'c'])
  // Input array is never mutated.
  assert.deepEqual(jobs.map((j) => j.id), ['a', 'b', 'c', 'd'])
})

test('search tokens strip PostgREST filter syntax and wildcards', () => {
  assert.deepEqual(searchTokens('  jane   doe '), ['jane', 'doe'])
  assert.deepEqual(searchTokens('a),email.eq.x,(b'), ['a', 'email', 'eq', 'x', 'b'])
  assert.deepEqual(searchTokens('100%_*'), ['100'])
  assert.deepEqual(searchTokens(''), [])
  assert.deepEqual(searchTokens(null), [])
  assert.ok(searchTokens('x '.repeat(50)).length <= 5)
  for (const token of searchTokens('a,b)(c.d%e_f*g\\h"i\'j')) {
    assert.doesNotMatch(token, /[,()%_*.\\"']/)
  }
})

test('profile links: https only, labelled, custom label for "other"', () => {
  const links = readProfileLinks([
    { platform: 'linkedin', url: 'https://linkedin.com/in/x' },
    { platform: 'github', url: 'http://github.com/x' },
    { platform: 'website', url: 'javascript:alert(1)' },
    { platform: 'portfolio', url: 'data:text/html,<script>' },
    { platform: 'other', label: 'My case study', url: 'https://example.com/c' },
    { platform: 'stackoverflow', url: 'https://stackoverflow.com/users/1' },
    { platform: 'unknown-thing', url: 'https://example.com/z' },
    null,
    'x',
  ])
  assert.deepEqual(
    links.map((l) => [l.label, l.url]),
    [
      ['LinkedIn', 'https://linkedin.com/in/x'],
      ['My case study', 'https://example.com/c'],
      ['Stack Overflow', 'https://stackoverflow.com/users/1'],
      ['Other', 'https://example.com/z'],
    ]
  )
  assert.deepEqual(readProfileLinks(undefined), [])
  assert.deepEqual(readProfileLinks('nope'), [])
})

test('resume labels', () => {
  assert.equal(resumeTypeLabel('application/pdf'), 'PDF')
  assert.equal(
    resumeTypeLabel('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    'DOCX'
  )
  assert.equal(resumeSizeLabel(2048), '2 KB')
  assert.equal(resumeSizeLabel(null), '')
  assert.equal(labelEmploymentType('part_time'), 'Part-time')
  assert.equal(labelEmploymentType(''), '—')
})

test('pagination math', () => {
  assert.equal(pageCount(0), 1)
  assert.equal(pageCount(20), 1)
  assert.equal(pageCount(21), 2)
  assert.equal(clampPage(9, 21), 2)
  assert.equal(clampPage(-3, 21), 1)
  assert.equal(clampPage('abc', 21), 1)
})

test('existing application status values are unchanged', () => {
  assert.deepEqual([...JOB_APPLICATION_STATUSES], [
    'new',
    'under_review',
    'shortlisted',
    'interview',
    'rejected',
    'hired',
  ])
  const css = readFileSync(new URL('../admin-dashboard.css', import.meta.url), 'utf8')
  for (const status of JOB_APPLICATION_STATUSES) {
    assert.match(css, new RegExp(`admin-leads-badge--status-${status}\\b`), status)
  }
})

// ── Navigation + RBAC ───────────────────────────────────────────────────────

test('Applicants nav item exists at /admin/careers/applications under the careers module', () => {
  const item = adminNavItems.find((i) => i.id === 'applicants')
  assert.ok(item)
  assert.equal(item.label, 'Applicants')
  assert.equal(item.path, '/admin/careers/applications')
  assert.equal(item.module, 'careers')
})

test('Applicants is visible to Administrators only; Editor and Sales never see it', () => {
  const labels = (role) =>
    getNavSectionsForRole(role, (moduleId) => canAccessModule(role, moduleId)).flatMap((s) =>
      s.items.map((i) => i.label)
    )
  assert.ok(labels('administrator').includes('Applicants'))
  assert.ok(labels('administrator').includes('Careers'))
  assert.ok(!labels('editor').includes('Applicants'))
  assert.ok(!labels('sales').includes('Applicants'))
})

test('every Applicants route is blocked for Editor and Sales', () => {
  const paths = [
    '/admin/careers/applications',
    '/admin/careers/applications/jobs/6f1c1d4e-2b0a-4c53-9a77-0d9b6f0c1a11',
    '/admin/careers/applications/6f1c1d4e-2b0a-4c53-9a77-0d9b6f0c1a11',
  ]
  for (const path of paths) {
    assert.equal(canAccessPath('administrator', path), true, path)
    assert.equal(canAccessPath('editor', path), false, path)
    assert.equal(canAccessPath('sales', path), false, path)
  }
})

test('sidebar highlights exactly one item (longest prefix wins)', () => {
  assert.equal(findActiveNavItemId('/admin/careers'), 'careers')
  assert.equal(findActiveNavItemId('/admin/careers/new'), 'careers')
  assert.equal(findActiveNavItemId('/admin/careers/applications'), 'applicants')
  assert.equal(findActiveNavItemId('/admin/careers/applications/jobs/abc'), 'applicants')
  assert.equal(findActiveNavItemId('/admin/careers/applications/abc'), 'applicants')
  assert.equal(findActiveNavItemId('/admin/leads'), 'leads')
  assert.equal(findActiveNavItemId('/admin/careersX'), null)
  assert.equal(findActiveNavItemId(undefined), null)
})

// ── Security wiring (static assertions on the server route + schema) ────────

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('resume route authenticates + authorizes before any database or storage access', () => {
  const route = source('../app/api/admin/careers/applications/[applicationId]/resume/route.ts')
  const auth = route.indexOf('authenticateAdministrator(')
  const idCheck = route.indexOf('isUuid(applicationId)')
  const db = route.indexOf('getSupabaseServiceRole()')
  assert.ok(auth > 0 && idCheck > auth && db > idCheck, 'auth → id validation → data access')
  assert.match(route, /if \(!auth\.ok\)/)
})

test('resume route never exposes a public URL, never caches, and returns generic errors', () => {
  const route = source('../app/api/admin/careers/applications/[applicationId]/resume/route.ts')
  assert.match(route, /createSignedUrl\(/)
  assert.doesNotMatch(route, /getPublicUrl/)
  assert.match(route, /SIGNED_URL_TTL_SECONDS = 60/)
  assert.match(route, /no-store/)
  // No raw database/storage error text is sent to the client.
  assert.doesNotMatch(route, /error: (error|signError)\.message/)
})

test('applicant data is only ever read through the admin-gated browser client or the admin route', () => {
  const publicApi = source('../app/api/careers/apply/route.ts')
  assert.doesNotMatch(publicApi, /export async function GET/)
  const queries = source('./next/jobApplicationsBrowser.ts')
  assert.match(queries, /^'use client'/m)
  assert.doesNotMatch(queries, /supabaseServiceRole/)
})

test('job_applications and the resume bucket stay admin-only / private in the schema', () => {
  const sql = source('../../supabase/migrations/20261114010000_job_applications.sql')
  assert.match(sql, /job_applications ENABLE ROW LEVEL SECURITY/i)

  // Every policy on the table is gated by is_admin(); none targets anon/public.
  const policies = sql.match(/CREATE POLICY[\s\S]*?;/gi) ?? []
  assert.ok(policies.length >= 2)
  for (const policy of policies) {
    assert.match(policy, /public\.is_admin\(\)/, policy)
    assert.doesNotMatch(policy, /TO\s+(anon|public)\b/i, policy)
  }

  // The resume bucket is created private.
  assert.match(sql, /'job-resumes',\s*'job-resumes',\s*false/)
  assert.doesNotMatch(sql, /public\s*=\s*true/i)
})

test('hiring-notification migration is additive, timestamped after the applications table, and not auto-applied', () => {
  const name = '20261118130000_job_applications_hiring_notification_status.sql'
  const sql = source(`../../supabase/migrations/${name}`)
  assert.match(sql, /ADD COLUMN IF NOT EXISTS hiring_notification_status/)
  assert.match(sql, /ADD COLUMN IF NOT EXISTS hiring_notification_error/)
  // Ignore the commented-out rollback block when checking for destructive statements.
  const executable = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
  assert.doesNotMatch(executable, /\bDROP\b|\bTRUNCATE\b|\bDELETE\b/i)
  assert.doesNotMatch(executable, /CREATE POLICY|GRANT |DISABLE ROW LEVEL SECURITY/i)
})
