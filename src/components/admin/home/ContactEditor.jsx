import React from 'react'
import { inquiryServiceOptions } from '@/data/inquiryServices'
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
  const hasServiceOptionsKey = Object.prototype.hasOwnProperty.call(config, 'service_options')
  const serviceOptions = Array.isArray(config.service_options)
    ? config.service_options.map((item) =>
        typeof item === 'string' ? item : String(item?.label ?? '')
      )
    : []
  const displayServiceOptions = hasServiceOptionsKey ? serviceOptions : [...inquiryServiceOptions]

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Contact"
      description="Homepage contact section headline, inquiry service dropdown options, capabilities, and trust signals."
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
        label="Inquiry service options"
        itemLabel="Service"
        items={displayServiceOptions}
        reorderable
        onChange={(next) =>
          onConfigChange(
            'service_options',
            next.map((item) => String(item ?? '').trim()).filter(Boolean)
          )
        }
        createItem={() => ''}
        renderItem={(item, index, onItemChange) => (
          <EditorField
            id={`contact-service-option-${index}`}
            label="Option label"
            hint="Shown in the contact form “Select Service” dropdown."
          >
            <input
              id={`contact-service-option-${index}`}
              type="text"
              className="admin-settings-input"
              value={typeof item === 'string' ? item : ''}
              onChange={(e) => onItemChange(e.target.value)}
              placeholder="e.g. Web Development"
            />
          </EditorField>
        )}
      />
      {!hasServiceOptionsKey ? (
        <p className="admin-settings-hint">
          Showing defaults — edit, reorder, add, or delete options, then save to control the public
          form dropdown.
        </p>
      ) : displayServiceOptions.length === 0 ? (
        <p className="admin-settings-hint">
          No options saved — the dropdown will fall back to the default list until you add at least
          one option.
        </p>
      ) : null}

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
