import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canAccessModule,
  canAccessPath,
  canManageContent,
} from './cmsPermissions.js'

test('blog access: administrator and editor yes, sales no', () => {
  assert.equal(canAccessModule('administrator', 'blogs'), true)
  assert.equal(canAccessModule('editor', 'blogs'), true)
  assert.equal(canAccessModule('sales', 'blogs'), false)
  assert.equal(canAccessPath('editor', '/admin/blogs/abc'), true)
  assert.equal(canAccessPath('sales', '/admin/blogs'), false)
})

test('careers access: administrator only', () => {
  assert.equal(canAccessModule('administrator', 'careers'), true)
  assert.equal(canAccessModule('editor', 'careers'), false)
  assert.equal(canAccessModule('sales', 'careers'), false)
  assert.equal(canAccessPath('administrator', '/admin/careers/xyz'), true)
  assert.equal(canAccessPath('editor', '/admin/careers'), false)
  assert.equal(canAccessPath('sales', '/admin/careers'), false)
})

test('canManageContent includes blogs but not careers-only sales', () => {
  assert.equal(canManageContent('editor'), true)
  assert.equal(canManageContent('sales'), false)
})
