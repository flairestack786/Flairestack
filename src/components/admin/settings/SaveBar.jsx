import React from 'react'
import { Loader2, Save } from 'lucide-react'

/**
 * Sticky save bar for the admin Settings page.
 * @param {{
 *   isDirty: boolean,
 *   isSaving: boolean,
 *   onSave: () => void,
 * }} props
 */
export default function SaveBar({ isDirty, isSaving, onSave }) {
  return (
    <div className={`admin-settings-savebar${isDirty ? ' admin-settings-savebar--dirty' : ''}`}>
      <div className="admin-settings-savebar-inner">
        <p className="admin-settings-savebar-status" aria-live="polite">
          {isSaving ? 'Saving changes…' : isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </p>

        <button
          type="button"
          className="admin-settings-savebar-btn"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <Loader2 size={16} strokeWidth={1.75} className="admin-settings-savebar-spinner" aria-hidden />
          ) : (
            <Save size={16} strokeWidth={1.75} aria-hidden />
          )}
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
