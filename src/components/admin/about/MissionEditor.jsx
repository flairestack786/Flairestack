import React from 'react'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function MissionEditor({ section, onFieldChange, panelId, labelledBy }) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Mission"
      description="Mission statement headline and body copy."
    >
      <EditorField id="mission-eyebrow" label="Eyebrow">
        <input
          id="mission-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="mission-title" label="Title">
        <input
          id="mission-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="mission-title-accent" label="Title accent">
        <input
          id="mission-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="mission-body" label="Body">
        <textarea
          id="mission-body"
          className="admin-settings-textarea"
          rows={8}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>
    </EditorSection>
  )
}
