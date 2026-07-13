import React, { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Related keyword chip input.
 * @param {{
 *   value: string[],
 *   onChange: (next: string[]) => void,
 *   placeholder?: string,
 * }} props
 */
export default function SeoKeywordChips({ value = [], onChange, placeholder = 'Add keyword and press Enter' }) {
  const [draft, setDraft] = useState('')

  const addKeyword = () => {
    const next = draft.trim()
    if (!next) return
    if (value.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, next])
    setDraft('')
  }

  return (
    <div className="admin-seo-chips">
      <div className="admin-seo-chips-list">
        {value.map((keyword) => (
          <span key={keyword} className="admin-seo-chip-tag">
            {keyword}
            <button
              type="button"
              className="admin-seo-chip-remove"
              aria-label={`Remove ${keyword}`}
              onClick={() => onChange(value.filter((item) => item !== keyword))}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="admin-settings-input"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            addKeyword()
          }
        }}
        onBlur={addKeyword}
      />
      <p className="admin-users-field-hint">
        Related keywords are stored for AI / analytics — not output as meta keywords.
      </p>
    </div>
  )
}
