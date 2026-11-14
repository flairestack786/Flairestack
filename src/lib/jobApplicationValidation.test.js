import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isValidHttpsUrl,
  looksLikeResumeBytes,
  sanitizeProfileLinks,
  validateApplicationFields,
  validateResumeIdentity,
} from './jobApplicationValidation.js'

test('validateApplicationFields requires core identity fields', () => {
  const bad = validateApplicationFields({})
  assert.equal(bad.ok, false)
  if (!bad.ok) {
    assert.ok(bad.errors.first_name)
    assert.ok(bad.errors.email)
  }

  const good = validateApplicationFields({
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1 555 0100',
  })
  assert.equal(good.ok, true)
})

test('validateResumeIdentity accepts pdf/docx and rejects others', () => {
  assert.equal(validateResumeIdentity('resume.pdf', 'application/pdf').ok, true)
  assert.equal(
    validateResumeIdentity(
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).ok,
    true
  )
  assert.equal(validateResumeIdentity('resume.exe', 'application/octet-stream').ok, false)
})

test('looksLikeResumeBytes sniffs PDF and ZIP/DOCX headers', () => {
  assert.equal(looksLikeResumeBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), '.pdf'), true)
  assert.equal(looksLikeResumeBytes(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]), '.docx'), true)
  assert.equal(looksLikeResumeBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]), '.pdf'), false)
})

test('sanitizeProfileLinks keeps only valid https urls', () => {
  const links = sanitizeProfileLinks([
    { platform: 'github', url: 'https://github.com/ada' },
    { platform: 'linkedin', url: 'http://linkedin.com/in/ada' },
    { platform: 'other', url: 'not-a-url' },
    { platform: 'website', url: 'https://example.com' },
  ])
  assert.deepEqual(links, [
    { platform: 'github', url: 'https://github.com/ada' },
    { platform: 'website', url: 'https://example.com' },
  ])
  assert.equal(isValidHttpsUrl('https://ok.test'), true)
  assert.equal(isValidHttpsUrl('javascript:alert(1)'), false)
})
