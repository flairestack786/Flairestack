import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('service-role client is marked server-only as its first import', () => {
  const text = source('./next/supabaseServiceRole.ts')
  const firstImport = text.split(/\r?\n/).find((line) => line.startsWith('import '))
  assert.match(firstImport, /^import 'server-only';?$/)
  assert.doesNotMatch(text, /^'use client'/m)
})

test('browser-safe Supabase client is not marked server-only', () => {
  const text = source('./next/supabaseBrowser.ts')
  assert.doesNotMatch(text, /server-only/)
  assert.match(text, /^'use client'/m)
})

test('the service-role module is imported only by server API routes', () => {
  for (const file of [
    '../app/api/inquiry/submit/route.ts',
    '../app/api/careers/apply/route.ts',
    '../app/api/admin/careers/applications/[applicationId]/resume/route.ts',
  ]) {
    assert.match(source(file), /@\/lib\/next\/supabaseServiceRole/, file)
  }
})
