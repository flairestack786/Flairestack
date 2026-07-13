import * as LucideIcons from 'lucide-react'
import { Layers } from 'lucide-react'

/**
 * Resolve a Lucide icon component by PascalCase name.
 * @param {string | null | undefined} name
 * @param {import('react').ComponentType<{ size?: number, strokeWidth?: number, 'aria-hidden'?: boolean }>} [fallback]
 */
export function resolveLucideIcon(name, fallback = Layers) {
  if (!name || typeof name !== 'string') {
    return fallback
  }

  const trimmed = name.trim()
  if (!trimmed) {
    return fallback
  }

  const Icon = LucideIcons[trimmed]
  return Icon ?? fallback
}
