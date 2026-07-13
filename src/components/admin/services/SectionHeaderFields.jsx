import React from 'react'
import EditorField from '../home/EditorField'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | boolean) => void,
 *   showEyebrow?: boolean,
 *   showBody?: boolean,
 * }} props
 */
export default function SectionHeaderFields({
  section,
  onFieldChange,
  showEyebrow = true,
  showBody = false,
}) {
  return (
    <>
      <EditorField id="section-enabled" label="Section enabled">
        <label className="admin-settings-checkbox">
          <input
            type="checkbox"
            checked={Boolean(section.is_enabled)}
            onChange={(e) => onFieldChange('is_enabled', e.target.checked)}
          />
          <span>Show this section on the public page</span>
        </label>
      </EditorField>

      {showEyebrow && (
        <EditorField id="section-eyebrow" label="Eyebrow">
          <input
            id="section-eyebrow"
            type="text"
            className="admin-settings-input"
            value={section.eyebrow}
            onChange={(e) => onFieldChange('eyebrow', e.target.value)}
          />
        </EditorField>
      )}

      <EditorField id="section-title" label="Title">
        <input
          id="section-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="section-intro" label="Intro">
        <textarea
          id="section-intro"
          className="admin-settings-textarea"
          rows={3}
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      {showBody && (
        <EditorField id="section-body" label="Body">
          <textarea
            id="section-body"
            className="admin-settings-textarea"
            rows={4}
            value={section.body}
            onChange={(e) => onFieldChange('body', e.target.value)}
          />
        </EditorField>
      )}
    </>
  )
}
