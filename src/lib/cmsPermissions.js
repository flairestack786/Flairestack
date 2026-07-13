/** @typedef {'administrator' | 'editor' | 'sales'} CmsRole */
/** @typedef {'dashboard' | 'home' | 'about' | 'services' | 'testimonials' | 'media' | 'leads' | 'users' | 'seo' | 'settings'} CmsModuleId */

/** @type {readonly CmsModuleId[]} */
export const CMS_MODULE_IDS = Object.freeze([
  'dashboard',
  'home',
  'about',
  'services',
  'testimonials',
  'media',
  'leads',
  'users',
  'seo',
  'settings',
])

/**
 * Central permission map for FlaireStack CMS.
 * Add roles/modules here — pages and nav read from this config.
 * @type {Record<CmsRole, readonly CmsModuleId[]>}
 */
export const CMS_ROLE_MODULES = Object.freeze({
  administrator: Object.freeze([
    'dashboard',
    'home',
    'about',
    'services',
    'testimonials',
    'media',
    'leads',
    'users',
    'seo',
    'settings',
  ]),
  editor: Object.freeze([
    'dashboard',
    'home',
    'about',
    'services',
    'testimonials',
    'media',
  ]),
  sales: Object.freeze(['dashboard', 'leads']),
})

/** Admin-only actions enforced in UI + server. */
export const CMS_ADMIN_ACTIONS = Object.freeze({
  inviteUsers: ['administrator'],
  changeUserRoles: ['administrator'],
  disableUsers: ['administrator'],
  revokeInvites: ['administrator'],
  resendInvites: ['administrator'],
  passwordReset: ['administrator'],
  manageUsers: ['administrator'],
})

/**
 * @param {string | null | undefined} role
 * @returns {CmsRole}
 */
export function normalizeCmsRole(role) {
  if (role === 'editor') return 'editor'
  if (role === 'sales') return 'sales'
  return 'administrator'
}

/**
 * @param {string | null | undefined} role
 * @param {CmsModuleId} moduleId
 * @returns {boolean}
 */
export function canAccessModule(role, moduleId) {
  const normalized = normalizeCmsRole(role)
  return CMS_ROLE_MODULES[normalized]?.includes(moduleId) ?? false
}

/**
 * True when the role can manage CMS content modules.
 * @param {string | null | undefined} role
 */
export function canManageContent(role) {
  return (
    canAccessModule(role, 'home') ||
    canAccessModule(role, 'about') ||
    canAccessModule(role, 'services') ||
    canAccessModule(role, 'testimonials') ||
    canAccessModule(role, 'media')
  )
}

/**
 * @param {string | null | undefined} role
 * @param {string} pathname
 * @returns {boolean}
 */
export function canAccessPath(role, pathname) {
  const modules = CMS_ROLE_MODULES[normalizeCmsRole(role)] ?? []
  return modules.some((moduleId) => {
    const config = CMS_MODULE_ROUTES[moduleId]
    if (!config) return false
    return pathname === config.path || pathname.startsWith(`${config.path}/`)
  })
}

/**
 * @param {string | null | undefined} role
 * @param {keyof typeof CMS_ADMIN_ACTIONS} action
 * @returns {boolean}
 */
export function canPerformAdminAction(role, action) {
  const allowed = CMS_ADMIN_ACTIONS[action] ?? []
  return allowed.includes(normalizeCmsRole(role))
}

/**
 * @param {string | null | undefined} role
 * @returns {CmsModuleId[]}
 */
export function getModulesForRole(role) {
  return [...(CMS_ROLE_MODULES[normalizeCmsRole(role)] ?? [])]
}

/** Route metadata keyed by module id (mirrors adminNav). */
export const CMS_MODULE_ROUTES = Object.freeze({
  dashboard: { path: '/admin/dashboard', navId: 'dashboard' },
  home: { path: '/admin/home', navId: 'home' },
  about: { path: '/admin/about', navId: 'about' },
  services: { path: '/admin/services', navId: 'services' },
  testimonials: { path: '/admin/testimonials', navId: 'testimonials' },
  media: { path: '/admin/media', navId: 'media' },
  leads: { path: '/admin/leads', navId: 'leads' },
  users: { path: '/admin/users', navId: 'users' },
  seo: { path: '/admin/seo', navId: 'seo' },
  settings: { path: '/admin/settings', navId: 'settings' },
})

/** User-facing message when last-admin safety blocks an action. */
export const LAST_ADMIN_GUARD_MESSAGE =
  'This action is blocked because it would remove the last active Administrator. Assign another Administrator first.'
