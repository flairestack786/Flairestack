import React from 'react'
import EditorField from './EditorField'
import EditorSection from './EditorSection'

/**
 * @param {string[] | undefined} values
 * @returns {string}
 */
function rowsToText(values) {
  return Array.isArray(values) ? values.join('\n') : ''
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function textToRows(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function TechnologiesEditor({
  section,
  onFieldChange,
  onConfigChange,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Technologies"
      description="Marquee technology names displayed in two scrolling rows."
    >
      <EditorField id="tech-eyebrow" label="Eyebrow">
        <input
          id="tech-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="tech-title" label="Title">
        <input
          id="tech-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="tech-title-accent" label="Title accent">
        <input
          id="tech-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="tech-intro" label="Intro">
        <textarea
          id="tech-intro"
          className="admin-settings-textarea"
          rows={3}
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField id="tech-row-a" label="Row A" hint="One technology name per line.">
        <textarea
          id="tech-row-a"
          className="admin-settings-textarea"
          rows={8}
          value={rowsToText(config.row_a)}
          onChange={(e) => onConfigChange('row_a', textToRows(e.target.value))}
        />
      </EditorField>

      <EditorField id="tech-row-b" label="Row B" hint="One technology name per line.">
        <textarea
          id="tech-row-b"
          className="admin-settings-textarea"
          rows={8}
          value={rowsToText(config.row_b)}
          onChange={(e) => onConfigChange('row_b', textToRows(e.target.value))}
        />
      </EditorField>
    </EditorSection>
  )
}
