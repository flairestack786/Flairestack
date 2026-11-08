import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatMediaFileSize,
  formatMediaUploadDate,
  getMediaDisplayFilename,
  getMediaFileFormat,
  getMediaKind,
  resolveStorageCreatedAt,
  resolveStorageFileSize,
  resolveStorageMimeType,
} from './mediaMetadata.js'

test('formatMediaFileSize uses KB, MB, and GB consistently', () => {
  assert.equal(formatMediaFileSize(512), '512 B')
  assert.equal(formatMediaFileSize(245 * 1024), '245 KB')
  assert.equal(formatMediaFileSize(1.8 * 1024 * 1024), '1.8 MB')
  assert.equal(formatMediaFileSize(12.4 * 1024 * 1024), '12.4 MB')
  assert.equal(formatMediaFileSize(2.5 * 1024 * 1024 * 1024), '2.5 GB')
  assert.equal(formatMediaFileSize(null), null)
  assert.equal(formatMediaFileSize(undefined), null)
})

test('getMediaFileFormat prefers extension and falls back to MIME', () => {
  assert.equal(getMediaFileFormat('cloud-strategy.webp'), 'WEBP')
  assert.equal(getMediaFileFormat('photo.JPEG'), 'JPG')
  assert.equal(getMediaFileFormat('logo.svg'), 'SVG')
  assert.equal(getMediaFileFormat('clip.mp4'), 'MP4')
  assert.equal(getMediaFileFormat('mystery-bin', 'image/png'), 'PNG')
  assert.equal(getMediaFileFormat('mystery-bin', 'video/webm'), 'WEBM')
  assert.equal(getMediaFileFormat('no-ext', ''), null)
})

test('getMediaKind supports image, video, svg, and other filters', () => {
  assert.equal(getMediaKind('hero.png'), 'image')
  assert.equal(getMediaKind('mark.svg'), 'svg')
  assert.equal(getMediaKind('intro.mp4'), 'video')
  assert.equal(getMediaKind('notes.txt'), 'other')
  assert.equal(getMediaKind('blob', 'image/svg+xml'), 'svg')
})

test('Storage helpers read size, mime, created_at, and filename without inventing values', () => {
  const file = {
    name: 'cloud-strategy-resilient-by-design-ab12cd34.webp',
    created_at: '2026-11-08T15:30:00.000Z',
    updated_at: '2026-11-09T10:00:00.000Z',
    metadata: {
      size: 1887436,
      mimetype: 'image/webp',
      originalFilename: 'cloud-strategy-resilient-by-design.webp',
    },
  }

  assert.equal(resolveStorageFileSize(file), 1887436)
  assert.equal(resolveStorageMimeType(file), 'image/webp')
  assert.equal(resolveStorageCreatedAt(file), '2026-11-08T15:30:00.000Z')
  assert.equal(getMediaDisplayFilename(file), 'cloud-strategy-resilient-by-design.webp')
  assert.equal(formatMediaFileSize(resolveStorageFileSize(file)), '1.8 MB')
  assert.equal(getMediaFileFormat(file.name, resolveStorageMimeType(file)), 'WEBP')

  // Upload date must use created_at only — never fall back to updated_at.
  assert.equal(resolveStorageCreatedAt({ updated_at: '2026-11-09T10:00:00.000Z' }), null)
  assert.equal(formatMediaUploadDate(resolveStorageCreatedAt({ updated_at: '2026-11-09T10:00:00.000Z' })), null)
  assert.match(formatMediaUploadDate(file.created_at) ?? '', /2026/)
})
