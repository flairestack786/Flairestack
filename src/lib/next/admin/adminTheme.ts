export type AdminThemePreference = 'system' | 'dark' | 'light'
export type AdminResolvedTheme = 'dark' | 'light'

export const ADMIN_THEME_STORAGE_KEY = 'flairestack.admin.theme'

/** Local daytime window (inclusive start, exclusive end) for System mode. */
const SYSTEM_LIGHT_START_HOUR = 6
const SYSTEM_LIGHT_END_HOUR = 18

export function isAdminThemePreference(value: unknown): value is AdminThemePreference {
  return value === 'system' || value === 'dark' || value === 'light'
}

/**
 * System follows the user's PC local clock: light by day, dark by night.
 */
export function resolveThemeFromLocalTime(date = new Date()): AdminResolvedTheme {
  const hour = date.getHours()
  return hour >= SYSTEM_LIGHT_START_HOUR && hour < SYSTEM_LIGHT_END_HOUR ? 'light' : 'dark'
}

export function resolveAdminTheme(
  preference: AdminThemePreference,
  date = new Date()
): AdminResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  return resolveThemeFromLocalTime(date)
}

export function readAdminThemePreference(): AdminThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (isAdminThemePreference(stored)) return stored
  } catch {
    // ignore storage access errors
  }
  return 'system'
}

export function writeAdminThemePreference(preference: AdminThemePreference) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, preference)
  } catch {
    // ignore storage access errors
  }
}

export function applyAdminThemeToDocument(
  preference: AdminThemePreference,
  resolved: AdminResolvedTheme
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.adminThemePref = preference
  root.dataset.adminTheme = resolved
  root.style.colorScheme = resolved
}
