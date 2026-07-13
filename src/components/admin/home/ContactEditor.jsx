import React from 'react'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ContactEditor({
  section,
  onFieldChange,
  onConfigChange,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const capabilities = Array.isArray(config.capabilities) ? config.capabilities : []
  const trustItems = Array.isArray(config.trust_items) ? config.trust_items : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Contact"
      description="Homepage contact section headline, capabilities list, and trust signals."
    >
      <EditorField id="contact-eyebrow" label="Eyebrow">
        <input
          id="contact-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="contact-title" label="Title">
        <input
          id="contact-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="contact-title-accent" label="Title accent">
        <input
          id="contact-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="contact-body" label="Body">
        <textarea
          id="contact-body"
          className="admin-settings-textarea"
          rows={4}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Capabilities"
        itemLabel="Capability"
        items={capabilities}
        onChange={(next) => onConfigChange('capabilities', next)}
        createItem={() => ''}
        renderItem={(item, _index, onItemChange) => (
          <input
            type="text"
            className="admin-settings-input"
            value={typeof item === 'string' ? item : ''}
            onChange={(e) => onItemChange(e.target.value)}
          />
        )}
      />

      <EditorList
        label="Trust items"
        itemLabel="Trust item"
        items={trustItems}
        onChange={(next) => onConfigChange('trust_items', next)}
        createItem={() => ({ icon_name: 'Shield', text: '' })}
        renderItem={(item, _index, onItemChange) => {
          const trust = /** @type {{ icon_name?: string, text?: string }} */ (item)
          return (
            <>
              <EditorField id={`trust-icon-${_index}`} label="Icon name">
                <input
                  id={`trust-icon-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={trust.icon_name ?? ''}
                  onChange={(e) => onItemChange({ ...trust, icon_name: e.target.value })}
                />
              </EditorField>

              <EditorField id={`trust-text-${_index}`} label="Text">
                <input
                  id={`trust-text-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={trust.text ?? ''}
                  onChange={(e) => onItemChange({ ...trust, text: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
