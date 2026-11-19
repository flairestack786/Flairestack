import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import {
  fetchJobApplicants,
  fetchJobSummaries,
  fetchJobSummary,
} from './applicantsQueries.js'

const JOB_A = '11111111-1111-4111-8111-111111111111'

/**
 * Real supabase-js / PostgREST client with a fake `fetch`: the code under test builds
 * the genuine request URL, and the test asserts on it (no live database involved).
 */
function fakeClient(respond) {
  const requests = []
  const fetch = async (input, init = {}) => {
    const url = new URL(String(input instanceof Request ? input.url : input))
    requests.push({ url, headers: new Headers(init.headers ?? {}) })
    const { status = 200, body = [], headers = {} } = respond(url, requests.length) ?? {}
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    })
  }
  const client = createClient('https://example.supabase.co', 'anon-key', {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { client, requests }
}

test('overview issues ONE request for all jobs with aliased counts (no per-row queries)', async () => {
  const { client, requests } = fakeClient(() => ({
    body: [
      {
        id: JOB_A,
        title: 'Frontend Engineer',
        slug: 'fe',
        employment_type: 'full_time',
        location: 'Remote',
        status: 'published',
        total: [{ count: 12 }],
        new_count: [{ count: 4 }],
        last: [{ created_at: '2026-11-17T09:00:00Z' }],
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Designer',
        slug: 'd',
        employment_type: 'contract',
        location: 'Dubai',
        status: 'draft',
        total: [{ count: 0 }],
        new_count: [{ count: 0 }],
        last: [],
      },
    ],
  }))

  const jobs = await fetchJobSummaries(client)

  assert.equal(requests.length, 1)
  const { url } = requests[0]
  assert.equal(url.pathname, '/rest/v1/job_postings')
  const select = url.searchParams.get('select')
  assert.match(select, /total:job_applications\(count\)/)
  assert.match(select, /new_count:job_applications\(count\)/)
  assert.match(select, /last:job_applications\(created_at\)/)
  assert.equal(url.searchParams.get('new_count.application_status'), 'eq.new')
  assert.equal(url.searchParams.get('last.order'), 'created_at.desc')
  assert.equal(url.searchParams.get('last.limit'), '1')

  // Both jobs are returned — including the one with zero applicants.
  assert.equal(jobs.length, 2)
  assert.deepEqual(
    jobs.map((j) => [j.title, j.totalApplicants, j.newApplicants, j.lastApplicationAt]),
    [
      ['Frontend Engineer', 12, 4, '2026-11-17T09:00:00Z'],
      ['Designer', 0, 0, null],
    ]
  )
})

test('overview never filters out jobs without applicants (no inner join)', async () => {
  const { client, requests } = fakeClient(() => ({ body: [] }))
  await fetchJobSummaries(client)
  const select = requests[0].url.searchParams.get('select')
  assert.doesNotMatch(select, /!inner/)
})

test('single-job summary is scoped to that job id', async () => {
  const { client, requests } = fakeClient(() => ({
    body: {
      id: JOB_A,
      title: 'Frontend Engineer',
      status: 'published',
      total: [{ count: 3 }],
      new_count: [{ count: 1 }],
      last: [{ created_at: '2026-11-01T00:00:00Z' }],
    },
  }))
  const job = await fetchJobSummary(client, JOB_A)
  assert.equal(requests[0].url.searchParams.get('id'), `eq.${JOB_A}`)
  assert.equal(job.totalApplicants, 3)
  assert.equal(job.newApplicants, 1)
})

test('single-job summary returns null for an unknown job (PostgREST 406 / empty)', async () => {
  const { client } = fakeClient(() => ({ body: null, status: 200 }))
  assert.equal(await fetchJobSummary(client, JOB_A), null)
})

test('applicants are grouped by job: query is always scoped to one job_posting_id', async () => {
  const { client, requests } = fakeClient(() => ({
    body: [],
    headers: { 'Content-Range': '*/0' },
  }))
  await fetchJobApplicants(client, JOB_A)
  const { url } = requests[0]
  assert.equal(url.pathname, '/rest/v1/job_applications')
  assert.equal(url.searchParams.get('job_posting_id'), `eq.${JOB_A}`)
})

test('applicant list select omits cover letter and internal notes', async () => {
  const { client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  await fetchJobApplicants(client, JOB_A)
  const select = requests[0].url.searchParams.get('select')
  assert.doesNotMatch(select, /cover_letter|internal_notes|profile_links|resume_storage_path/)
  for (const col of ['first_name', 'email', 'phone', 'application_status', 'created_at', 'resume_original_filename']) {
    assert.ok(select.split(',').includes(col), col)
  }
})

test('status filter applies only for real statuses; bogus values are ignored', async () => {
  let { client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  await fetchJobApplicants(client, JOB_A, { status: 'shortlisted' })
  assert.equal(requests[0].url.searchParams.get('application_status'), 'eq.shortlisted')
  ;({ client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } })))
  await fetchJobApplicants(client, JOB_A, { status: 'hired);drop table x' })
  assert.equal(requests[0].url.searchParams.has('application_status'), false)
  ;({ client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } })))
  await fetchJobApplicants(client, JOB_A, { status: 'all' })
  assert.equal(requests[0].url.searchParams.has('application_status'), false)
})

test('search matches name or email; every token must match (AND across tokens)', async () => {
  const { client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  await fetchJobApplicants(client, JOB_A, { search: 'jane doe' })
  const ors = requests[0].url.searchParams.getAll('or')
  assert.equal(ors.length, 2)
  assert.equal(ors[0], '(first_name.ilike.%jane%,last_name.ilike.%jane%,email.ilike.%jane%)')
  assert.equal(ors[1], '(first_name.ilike.%doe%,last_name.ilike.%doe%,email.ilike.%doe%)')
})

test('search input cannot inject extra PostgREST filters', async () => {
  const { client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  await fetchJobApplicants(client, JOB_A, { search: 'x),application_status.eq.hired,(y' })
  const url = requests[0].url
  assert.equal(url.searchParams.has('application_status'), false)
  for (const group of url.searchParams.getAll('or')) {
    // Exactly three ilike clauses per token — nothing smuggled in.
    assert.equal(group.split(',').length, 3, group)
    assert.doesNotMatch(group, /application_status|\.eq\./)
  }
})

test('newest/oldest sort with a deterministic id tie-break', async () => {
  let { client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  await fetchJobApplicants(client, JOB_A, { sort: 'newest' })
  assert.equal(requests[0].url.searchParams.get('order'), 'created_at.desc,id.asc')
  ;({ client, requests } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } })))
  await fetchJobApplicants(client, JOB_A, { sort: 'oldest' })
  assert.equal(requests[0].url.searchParams.get('order'), 'created_at.asc,id.asc')
})

test('pagination: page size 20, exact count requested, total taken from Content-Range', async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ id: `r${i}`, first_name: 'A', last_name: 'B' }))
  const { client, requests } = fakeClient(() => ({
    body: rows,
    status: 206,
    headers: { 'Content-Range': '20-39/57' },
  }))
  const result = await fetchJobApplicants(client, JOB_A, { page: 2 })
  const { url, headers } = requests[0]
  assert.equal(url.searchParams.get('offset'), '20')
  assert.equal(url.searchParams.get('limit'), '20')
  assert.match(headers.get('Prefer') ?? '', /count=exact/)
  assert.equal(result.total, 57)
  assert.equal(result.page, 2)
  assert.equal(result.rows.length, 20)
})

test('a page beyond the end falls back to page 1 instead of erroring', async () => {
  const { client, requests } = fakeClient((url) =>
    url.searchParams.get('offset') === '0'
      ? { body: [{ id: 'r1' }], status: 200, headers: { 'Content-Range': '0-0/1' } }
      : {
          status: 416,
          body: { code: 'PGRST103', message: 'Requested range not satisfiable', details: null, hint: null },
        }
  )
  const result = await fetchJobApplicants(client, JOB_A, { page: 5 })
  assert.equal(requests.length, 2)
  assert.equal(result.page, 1)
  assert.equal(result.total, 1)
})

test('empty job: zero rows and zero total', async () => {
  const { client } = fakeClient(() => ({ body: [], headers: { 'Content-Range': '*/0' } }))
  const result = await fetchJobApplicants(client, JOB_A)
  assert.deepEqual([result.rows.length, result.total, result.page], [0, 0, 1])
})

test('invalid job ids are rejected before any request is made', async () => {
  const { client, requests } = fakeClient(() => ({ body: [] }))
  for (const bad of ['', 'abc', "1' or '1'='1", `${JOB_A}/../x`, null, undefined]) {
    await assert.rejects(fetchJobApplicants(client, bad), /Invalid job id/)
    await assert.rejects(fetchJobSummary(client, bad), /Invalid job id/)
  }
  assert.equal(requests.length, 0)
})

test('database errors surface instead of being swallowed as an empty list', async () => {
  const { client } = fakeClient(() => ({
    status: 401,
    body: { code: '42501', message: 'permission denied for table job_applications' },
  }))
  await assert.rejects(fetchJobApplicants(client, JOB_A))
  await assert.rejects(fetchJobSummaries(client))
})
