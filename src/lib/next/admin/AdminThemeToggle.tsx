'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import type { AdminThemePreference } from '@/lib/next/admin/adminTheme'

type AdminThemeToggleProps = {
  value: AdminThemePreference
  onChange: (next: AdminThemePreference) => void
}

const OPTIONS: Array<{
  id: AdminThemePreference
  label: string
  Icon: typeof Sun
}> = [
  { id: 'system', label: 'System', Icon: Monitor },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'light', label: 'Light', Icon: Sun },
]

export default function AdminThemeToggle({ value, onChange }: AdminThemeToggleProps) {
  return (
    <div className="admin-theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            className={`admin-theme-toggle-btn${active ? ' is-active' : ''}`}
            aria-label={label}
            aria-pressed={active}
            title={
              id === 'system'
                ? 'System — follows your PC local time (day light, night dark)'
                : label
            }
            onClick={() => onChange(id)}
          >
            <Icon size={15} strokeWidth={2} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
