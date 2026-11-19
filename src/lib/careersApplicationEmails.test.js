import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { hiringNotificationColumns, runApplicationEmails } from './careersApplicationEmails.js'

const ok = { ok: true, httpStatus: 200 }
const fail = { ok: false, error: 'EmailJS send failed (400)', httpStatus: 400 }
const skipped = { ok: false, skipped: true, error: 'not configured' }

function harness(overrides = {}) {
  const calls = []
  const delays = []
  const deps = {
    sendConfirmation: async () => {
      calls.push('confirmation')
      return ok
    },
    sendNotification: async () => {
      calls.push('notification')
      return ok
    },
    recordConfirmation: async (r) => void calls.push(`record-confirmation:${r.ok}`),
    recordNotification: async (r) => void calls.push(`record-notification:${r.ok}`),
    delay: async (ms) => void delays.push(ms),
    log: () => {},
    ...overrides,
  }
  return { calls, delays, deps }
}

test('sends exactly one confirmation and exactly one hiring notification, in order', async () => {
  const { calls, deps } = harness()
  const result = await runApplicationEmails(deps)
  assert.deepEqual(calls, [
    'confirmation',
    'record-confirmation:true',
    'notification',
    'record-notification:true',
  ])
  assert.equal(result.confirmation.ok, true)
  assert.equal(result.notification.ok, true)
})

test('sends are spaced by more than 1 second (EmailJS rate limit)', async () => {
  const { delays, deps } = harness()
  await runApplicationEmails(deps)
  assert.equal(delays.length, 1)
  assert.ok(delays[0] >= 1000, `spacing ${delays[0]}ms`)
})

test('no wait when the confirmation was skipped (no request was made)', async () => {
  const { delays, deps } = harness({ sendConfirmation: async () => skipped })
  await runApplicationEmails(deps)
  assert.equal(delays.length, 0)
})

test('a failed applicant confirmation does not suppress the hiring notification', async () => {
  const { calls, deps } = harness({ sendConfirmation: async () => fail })
  const result = await runApplicationEmails(deps)
  assert.ok(calls.includes('notification'))
  assert.equal(result.confirmation.ok, false)
  assert.equal(result.notification.ok, true)
})

test('email failures never throw, so a saved application is never undone', async () => {
  const { deps } = harness({
    sendConfirmation: async () => {
      throw new Error('network down')
    },
    sendNotification: async () => {
      throw new Error('smtp exploded')
    },
    recordConfirmation: async () => {
      throw new Error('db down')
    },
    recordNotification: async () => {
      throw new Error('db down')
    },
  })
  const result = await runApplicationEmails(deps)
  assert.equal(result.confirmation.ok, false)
  assert.equal(result.notification.ok, false)
  // Thrown error text (which could contain secrets) is replaced with a generic message.
  assert.equal(result.notification.error, 'Email delivery failed.')
})

test('a hiring-notification failure is recorded as failed with a bounded error', () => {
  assert.deepEqual(hiringNotificationColumns(ok), {
    hiring_notification_status: 'sent',
    hiring_notification_error: '',
  })
  assert.equal(hiringNotificationColumns(skipped).hiring_notification_status, 'skipped')
  const failed = hiringNotificationColumns({ ok: false, error: 'x'.repeat(2000) })
  assert.equal(failed.hiring_notification_status, 'failed')
  assert.equal(failed.hiring_notification_error.length, 500)
})

test('careers apply route: one orchestration call, application is never removed after insert', () => {
  const route = readFileSync(
    new URL('../app/api/careers/apply/route.ts', import.meta.url),
    'utf8'
  )
  // Single send site per email kind → no duplicate notifications.
  assert.equal((route.match(/sendHiringTeamNotificationEmail\(/g) ?? []).length, 1)
  assert.equal((route.match(/sendApplicationConfirmationEmail\(/g) ?? []).length, 1)
  assert.equal((route.match(/runApplicationEmails\(/g) ?? []).length, 1)

  // The resume cleanup path is disarmed once the application row is committed.
  const insertAt = route.search(/\.from\('job_applications'\)\s*\.insert\(/)
  const disarmAt = route.indexOf('resumePath = null', route.indexOf('Unable to save your application'))
  const emailsAt = route.indexOf('runApplicationEmails(')
  assert.ok(insertAt > 0 && disarmAt > insertAt && emailsAt > disarmAt)

  // The success response does not depend on email success.
  assert.match(route, /ok: true,[\s\S]*emailSent/)
})

test('inquiry route and config are untouched by the Careers notification', () => {
  const inquiry = readFileSync(
    new URL('../app/api/inquiry/submit/route.ts', import.meta.url),
    'utf8'
  )
  assert.doesNotMatch(inquiry, /hiringNotification|careersApplicationEmails|careers@flairestack/i)
})
