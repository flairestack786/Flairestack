import { createContext, useContext } from 'react'

/**
 * Shared resolver for Storage public URLs (Vite vs Next browser clients).
 * @type {import('react').Context<((path: string) => string) | null>}
 */
export const MediaUrlContext = createContext(null)

/**
 * @returns {(path: string) => string}
 */
export function useMediaPublicUrl() {
  const resolve = useContext(MediaUrlContext)
  if (!resolve) {
    throw new Error('useMediaPublicUrl must be used within a MediaUrlContext.Provider')
  }
  return resolve
}
