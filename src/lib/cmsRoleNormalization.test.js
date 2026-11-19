import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  CMS_ADMIN_ACTIONS,
  CMS_MODULE_IDS,
  CMS_MODULE_ROUTES,
  CMS_ROLES,
  canAccessModule,
  canAccessPath,
  canManageContent,
  canManageGlobalSeo,
  canPerformAdminAction,
  getModulesForRole,
  isCmsRole,
  normalizeCmsRole,
  resolveCmsAccess,
} from './cmsPermissions.js'
import { getNavSectionsForRole } from '../data/adminNav.js'

/** Missing, unknown and malformed values. None may ever resolve to a role. */
const INVALID_ROLES = [
  undefined,
  null,
  '',
  ' ',
  'admin',
  'Administrator',
  'ADMINISTRATOR',
  ' administrator',
  'administrator ',
  'administrator\n',
  'administrator\u0000',
  'administrators',
  'Editor',
  'SALES',
  'superuser',
  'owner',
  'root',
  'viewer',
  'service_role',
  'authenticated',
  'null',
  'undefined',
  0,
  1,
  true,
  false,
  NaN,
  {},
  [],
  ['administrator'],
  { role: 'administrator' },
  { toString: () => 'administrator' },
  Object('administrator'),
  Symbol('administrator'),
]

const label = (value) => {
  try {
    return typeof value === 'symbol' ? value.toString() : JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

const ADMIN_ONLY_PATHS = [
  '/admin/careers',
  '/admin/careers/applications',
  '/admin/careers/applications/jobs/6f1c1d4e-2b0a-4c53-9a77-0d9b6f0c1a11',
  '/admin/careers/applications/6f1c1d4e-2b0a-4c53-9a77-0d9b6f0c1a11',
  '/admin/users',
  '/admin/settings',
]
const ALL_CMS_PATHS = [
  ...ADMIN_ONLY_PATHS,
  '/admin/dashboard',
  '/admin/leads',
  '/admin/blogs',
  '/admin/services',
  '/admin/seo',
  '/admin/media',
]

// ── Valid roles are preserved exactly ───────────────────────────────────────

test('the three valid roles pass through unchanged', () => {
  assert.deepEqual([...CMS_ROLES], ['administrator', 'editor', 'sales'])
  for (const role of CMS_ROLES) {
    assert.equal(normalizeCmsRole(role), role)
    assert.equal(isCmsRole(role), true)
  }
})

test('existing permission matrix is unchanged for valid roles', () => {
  assert.deepEqual(getModulesForRole('administrator'), [...CMS_MODULE_IDS])
  assert.deepEqual(getModulesForRole('editor'), [
    'dashboard',
    'home',
    'about',
    'services',
    'testimonials',
    'blogs',
    'media',
    'seo',
  ])
  assert.deepEqual(getModulesForRole('sales'), ['dashboard', 'leads'])

  assert.equal(canManageContent('administrator'), true)
  assert.equal(canManageContent('editor'), true)
  assert.equal(canManageContent('sales'), false)

  for (const action of Object.keys(CMS_ADMIN_ACTIONS)) {
    assert.equal(canPerformAdminAction('administrator', action), true, action)
    assert.equal(canPerformAdminAction('editor', action), false, action)
    assert.equal(canPerformAdminAction('sales', action), false, action)
  }
  assert.equal(canManageGlobalSeo('administrator'), true)
  assert.equal(canManageGlobalSeo('editor'), false)
})

test('Applicants, Careers, resumes, Users and Settings stay administrator-only', () => {
  for (const path of ADMIN_ONLY_PATHS) {
    assert.equal(canAccessPath('administrator', path), true, path)
    assert.equal(canAccessPath('editor', path), false, path)
    assert.equal(canAccessPath('sales', path), false, path)
  }
  assert.equal(canAccessPath('sales', '/admin/leads'), true)
  assert.equal(canAccessPath('editor', '/admin/leads'), false)
  assert.equal(canAccessPath('editor', '/admin/blogs/x'), true)
})

// ── Invalid roles never receive any privilege ───────────────────────────────

test('missing, unknown and malformed roles normalize to null (never administrator)', () => {
  for (const role of INVALID_ROLES) {
    assert.equal(normalizeCmsRole(role), null, label(role))
    assert.equal(isCmsRole(role), false, label(role))
  }
})

test('invalid roles cannot access any module', () => {
  for (const role of INVALID_ROLES) {
    for (const moduleId of CMS_MODULE_IDS) {
      assert.equal(canAccessModule(role, moduleId), false, `${label(role)} → ${moduleId}`)
    }
    assert.deepEqual(getModulesForRole(role), [], label(role))
  }
})

test('invalid roles cannot access any CMS route, including Applicants and Leads', () => {
  for (const role of INVALID_ROLES) {
    for (const path of ALL_CMS_PATHS) {
      assert.equal(canAccessPath(role, path), false, `${label(role)} → ${path}`)
    }
    for (const { path } of Object.values(CMS_MODULE_ROUTES)) {
      assert.equal(canAccessPath(role, path), false, `${label(role)} → ${path}`)
    }
  }
})

test('invalid roles cannot perform admin actions or manage content / SEO', () => {
  for (const role of INVALID_ROLES) {
    for (const action of Object.keys(CMS_ADMIN_ACTIONS)) {
      assert.equal(canPerformAdminAction(role, action), false, `${label(role)} → ${action}`)
    }
    assert.equal(canManageContent(role), false, label(role))
    assert.equal(canManageGlobalSeo(role), false, label(role))
  }
})

test('invalid roles see no sidebar navigation at all', () => {
  for (const role of INVALID_ROLES) {
    const sections = getNavSectionsForRole(role, (moduleId) => canAccessModule(role, moduleId))
    assert.deepEqual(sections, [], label(role))
  }
})

// ── Shared access decision (browser gates + server routes) ──────────────────

test('resolveCmsAccess: only an active profile with a valid role is allowed', () => {
  for (const role of CMS_ROLES) {
    assert.deepEqual(resolveCmsAccess({ role, status: 'active' }), { ok: true, role })
  }
})

test('resolveCmsAccess: missing profile is denied', () => {
  for (const profile of [null, undefined, 'administrator', 42]) {
    assert.deepEqual(resolveCmsAccess(profile), { ok: false, reason: 'missing_profile' })
  }
})

test('resolveCmsAccess: inactive or invited accounts are denied even as administrator', () => {
  assert.deepEqual(resolveCmsAccess({ role: 'administrator', status: 'invited' }), {
    ok: false,
    reason: 'invited',
  })
  for (const status of ['disabled', 'suspended', '', null, undefined, 'Active', 'ACTIVE', 'enabled']) {
    assert.deepEqual(
      resolveCmsAccess({ role: 'administrator', status }),
      { ok: false, reason: 'inactive' },
      label(status)
    )
  }
})

test('resolveCmsAccess: active account with an unknown/missing/malformed role is denied', () => {
  for (const role of INVALID_ROLES) {
    assert.deepEqual(
      resolveCmsAccess({ role, status: 'active' }),
      { ok: false, reason: 'invalid_role' },
      label(role)
    )
  }
  assert.deepEqual(resolveCmsAccess({ status: 'active' }), { ok: false, reason: 'invalid_role' })
})

// ── User-management API rejects invalid roles (never promotes to administrator) ──

const handlers = await import('../../server/lib/adminUsersHandlers.mjs')
const actor = { id: '00000000-0000-4000-8000-000000000001', role: 'administrator' }

test('invite API rejects missing/unknown/malformed roles with 400 (no admin fallback)', async () => {
  for (const role of INVALID_ROLES.filter((r) => typeof r !== 'symbol')) {
    const result = await handlers.handleInviteUser({
      body: { email: 'new.user@example.com', role },
      adminProfile: actor,
    })
    assert.equal(result.status, 400, label(role))
    assert.match(String(result.body.error), /valid role/i, label(role))
  }
})

test('role-change API rejects missing/unknown/malformed roles with 400 (no admin fallback)', async () => {
  for (const role of INVALID_ROLES.filter((r) => typeof r !== 'symbol')) {
    const result = await handlers.handleUpdateUserRole({
      body: { role },
      params: { userId: '00000000-0000-4000-8000-000000000002' },
      adminProfile: actor,
    })
    assert.equal(result.status, 400, label(role))
    assert.match(String(result.body.error), /valid role/i, label(role))
  }
})

// ── Static wiring checks on gates, routes and the database trigger ──────────

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('no code path maps an unknown role to administrator', () => {
  const files = [
    './cmsPermissions.js',
    './next/NextAuthProvider.tsx',
    './next/NextAuthGates.tsx',
    './next/usersBrowser.ts',
    '../app/api/cms/revalidate/route.ts',
    '../app/admin/dashboard/AdminDashboardClient.tsx',
    '../../server/lib/adminUsersHandlers.mjs',
  ]
  for (const file of files) {
    const text = source(file)
    assert.doesNotMatch(text, /return ['"]administrator['"]/, file)
    assert.doesNotMatch(text, /\?\?\s*['"]administrator['"]/, file)
    assert.doesNotMatch(text, /:\s*['"]administrator['"]\s*$/m, file)
  }
})

test('protected gate denies when the role is invalid, and signs the account out', () => {
  const gates = source('./next/NextAuthGates.tsx')
  // Module denial must not be skipped when cmsRole is null.
  assert.doesNotMatch(gates, /cmsRole != null &&\s*!canAccessModule/)
  assert.match(gates, /if \(accessDenied\)/)
  assert.match(gates, /signOut\(\)/)
  assert.match(gates, /\/admin\/login\?reason=unauthorized/)
  // Children render only for an active CMS user (which implies a valid role).
  assert.match(gates, /if \(missingProfile \|\| !isActiveCmsUser\)/)

  const provider = source('./next/NextAuthProvider.tsx')
  assert.match(provider, /const isActiveCmsUser = access\.ok/)
  assert.match(provider, /resolveCmsAccess\(profile\)/)
})

test('server routes require an active administrator / valid content role', () => {
  const middleware = source('../../server/middleware/requireAdministrator.mjs')
  assert.match(
    middleware,
    /!profile \|\| profile\.role !== 'administrator' \|\| profile\.status !== 'active'/
  )

  const revalidate = source('../app/api/cms/revalidate/route.ts')
  assert.match(revalidate, /resolveCmsAccess\(profile\)/)
  assert.match(revalidate, /!access\.ok \|\| !canManageContent\(access\.role\)/)

  // Resume downloads and admin user-management are behind authenticateAdministrator.
  assert.match(
    source('../app/api/admin/careers/applications/[applicationId]/resume/route.ts'),
    /authenticateAdministrator\(/
  )
  const adminRoute = source('../app/api/admin/[...path]/route.ts')
  assert.ok((adminRoute.match(/authenticateAdministrator\(/g) ?? []).length >= 3)
})

test('accepting an invite only sets the role on first acceptance (no demotion rollback)', () => {
  const text = source('../../server/lib/adminUsersHandlers.mjs')
  const calls = text.match(/await activateAcceptedInviteProfile\([^)]*\)/g) ?? []
  assert.ok(calls.length >= 4, `found ${calls.length} call sites`)
  const withRole = calls.filter((call) => call.split(',').length > 2)
  assert.deepEqual(withRole, ['await activateAcceptedInviteProfile(admin, userId, updated.role)'])
})

test('auth trigger migration: no admin fallback, user metadata never grants a role', () => {
  const sql = source('../../supabase/migrations/20261118140000_harden_cms_role_defaults.sql')
  const body = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  assert.match(body, /ALTER TABLE public\.profiles ALTER COLUMN role DROP DEFAULT/)
  assert.match(body, /ALTER TABLE public\.user_invites ALTER COLUMN role DROP DEFAULT/)

  // Role inputs come from app_metadata only.
  const roleBlock = body.slice(body.indexOf('trusted_role_text :='), body.indexOf('SELECT ui.role'))
  assert.match(roleBlock, /raw_app_meta_data ->> 'cms_role'/)
  assert.doesNotMatch(roleBlock, /raw_user_meta_data/)

  // The fallback branch never yields administrator, and untrusted accounts start disabled.
  const fallback = body.match(/ELSE\s+profile_role := '(\w+)'::public\.cms_role/)
  assert.ok(fallback, 'fallback branch present')
  assert.notEqual(fallback[1], 'administrator')
  assert.match(body, /ELSE\s+profile_status := 'disabled'::public\.cms_user_status/)
  assert.match(body, /role = CASE WHEN role_is_trusted THEN EXCLUDED\.role ELSE public\.profiles\.role END/)
})
