import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estimateReadingTimeMinutes } from './blogReadingTime.js'
import { sanitizeCmsHtml } from './sanitizeCmsHtml.js'
import { publicBlogPath, publicCareerApplyPath, publicCareerPath } from './contentSlug.js'

test('estimateReadingTimeMinutes counts words from HTML', () => {
  assert.equal(estimateReadingTimeMinutes(''), 1)
  const html = `<p>${'word '.repeat(450)}</p>`
  assert.equal(estimateReadingTimeMinutes(html), 3)
})

test('sanitizeCmsHtml strips scripts and event handlers', () => {
  const dirty =
    '<p onclick="alert(1)">Hello</p><script>evil()</script><a href="javascript:alert(1)">x</a>'
  const clean = sanitizeCmsHtml(dirty)
  assert.match(clean, /Hello/)
  assert.doesNotMatch(clean, /script/i)
  assert.doesNotMatch(clean, /onclick/i)
  assert.doesNotMatch(clean, /javascript:/i)
})

test('public blog and career paths use kebab slugs', () => {
  assert.equal(publicBlogPath('Hello World'), '/blog/hello-world')
  assert.equal(publicCareerPath('Senior Engineer'), '/careers/senior-engineer')
  assert.equal(
    publicCareerApplyPath('Senior Engineer'),
    '/careers/senior-engineer/apply'
  )
})
