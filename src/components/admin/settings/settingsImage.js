/**
 * @param {string | null | undefined} path
 * @param {(path: string) => string} getPublicUrl
 * @returns {{ path: string, publicUrl: string, filename: string } | null}
 */
export function pathToPickerImage(path, getPublicUrl) {
  const normalized = path?.trim()
  if (!normalized) return null

  if (typeof getPublicUrl !== 'function') {
    throw new Error('pathToPickerImage requires a getPublicUrl function.')
  }

  return {
    path: normalized,
    publicUrl: getPublicUrl(normalized),
    filename: normalized.split('/').pop() ?? normalized,
  }
}
