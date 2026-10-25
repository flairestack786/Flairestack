import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatHeroUploadError,
  resolveHeroMediaContentType,
  validateHeroMediaFile,
  videoSourceTypeFromUrl,
} from './heroMediaUpload.js'

test('accepts supported image MIME types and sizes', () => {
  const result = validateHeroMediaFile({
    name: 'hero.png',
    type: 'image/png',
    size: 1024,
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.kind, 'image')
    assert.equal(result.contentType, 'image/png')
  }
})

test('accepts MP4 and WebM video MIME types under the size limit', () => {
  const mp4 = validateHeroMediaFile({
    name: 'skyline.mp4',
    type: 'video/mp4',
    size: 5 * 1024 * 1024,
  })
  assert.equal(mp4.ok, true)
  if (mp4.ok) {
    assert.equal(mp4.kind, 'video')
    assert.equal(mp4.contentType, 'video/mp4')
  }

  const webm = validateHeroMediaFile({
    name: 'skyline.webm',
    type: 'video/webm',
    size: 5 * 1024 * 1024,
  })
  assert.equal(webm.ok, true)
  if (webm.ok) {
    assert.equal(webm.kind, 'video')
    assert.equal(webm.contentType, 'video/webm')
  }
})

test('infers content type from extension when File.type is empty', () => {
  assert.equal(resolveHeroMediaContentType('clip.MP4', ''), 'video/mp4')
  assert.equal(resolveHeroMediaContentType('poster.JPEG', ''), 'image/jpeg')
  const result = validateHeroMediaFile({ name: 'clip.mp4', type: '', size: 1000 })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.contentType, 'video/mp4')
    assert.equal(result.kind, 'video')
  }
})

test('rejects unsupported types and oversized videos', () => {
  const bad = validateHeroMediaFile({
    name: 'payload.exe',
    type: 'application/x-msdownload',
    size: 10,
  })
  assert.equal(bad.ok, false)

  const huge = validateHeroMediaFile({
    name: 'huge.mp4',
    type: 'video/mp4',
    size: 90 * 1024 * 1024,
  })
  assert.equal(huge.ok, false)
  if (!huge.ok) {
    assert.match(huge.error, /80 MB/i)
  }
})

test('formatHeroUploadError explains Storage MIME allowlist failures', () => {
  const message = formatHeroUploadError({
    message: 'mime type video/mp4 is not supported',
  })
  assert.match(message, /20261025150000_site_media_allow_hero_video/)
  assert.match(message, /site-media/)
})

test('videoSourceTypeFromUrl picks mp4/webm from path', () => {
  assert.equal(videoSourceTypeFromUrl('https://cdn.example/hero/a.mp4'), 'video/mp4')
  assert.equal(videoSourceTypeFromUrl('https://cdn.example/hero/a.webm'), 'video/webm')
})
