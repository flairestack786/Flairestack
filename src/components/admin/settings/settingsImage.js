import { getPublicUrl } from '../../../lib/media'

/**
 * @param {string | null | undefined} path
 * @returns {{ path: string, publicUrl: string, filename: string } | null}
 */
export function pathToPickerImage(path) {
  const normalized = path?.trim()
  if (!normalized) return null

  return {
    path: normalized,
    publicUrl: getPublicUrl(normalized),
    filename: normalized.split('/').pop() ?? normalized,
  }
}
