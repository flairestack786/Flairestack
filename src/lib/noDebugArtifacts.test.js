import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SOURCE_DIRS = ['src', 'server', 'scripts']
const SOURCE_EXT = /\.(m?[jt]sx?)$/

function listSourceFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full))
    else if (SOURCE_EXT.test(name) && !name.endsWith('.test.js')) out.push(full)
  }
  return out
}

const files = SOURCE_DIRS.filter((dir) => existsSync(join(ROOT, dir))).flatMap((dir) =>
  listSourceFiles(join(ROOT, dir))
)

test('no agent debug-session instrumentation ships in source', () => {
  const offenders = files.filter((file) =>
    /127\.0\.0\.1:7579|X-Debug-Session-Id|#region agent log|agentDebugLog/.test(
      readFileSync(file, 'utf8')
    )
  )
  assert.deepEqual(offenders, [])
})

test('inquiry form has no Turnstile bypass', () => {
  const form = readFileSync(
    join(ROOT, 'src/components/next/public/home/HomeInquiryForm.tsx'),
    'utf8'
  )
  assert.doesNotMatch(form, /debugInquiry|DEBUG_INQUIRY_BYPASS/)
  assert.match(form, /submitInquiry\(\{\s*values: submitted,\s*turnstileToken,/)
  const route = readFileSync(join(ROOT, 'src/app/api/inquiry/submit/route.ts'), 'utf8')
  assert.match(route, /verifyTurnstile: verifyTurnstileToken/)
})

test('temporary diagnostic endpoint and probe script are removed', () => {
  assert.equal(existsSync(join(ROOT, 'src/app/api/debug-session-log')), false)
  assert.equal(existsSync(join(ROOT, 'scripts/debug-inquiry-emailjs-probe.mjs')), false)
})
