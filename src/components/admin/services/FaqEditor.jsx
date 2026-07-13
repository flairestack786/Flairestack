import React from 'react'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'
import SectionHeaderFields from './SectionHeaderFields'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | boolean) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function FaqEditor({ section, onFieldChange, onConfigChange, panelId, labelledBy }) {
  const config = section.config ?? {}
  const items = Array.isArray(config.items) ? config.items : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="FAQ"
      description="Frequently asked questions accordion content."
    >
      <SectionHeaderFields section={section} onFieldChange={onFieldChange} />

      <EditorList
        label="Questions"
        itemLabel="FAQ"
        items={items}
        reorderable
        onChange={(next) => onConfigChange('items', next)}
        createItem={() => ({ question: '', answer: '' })}
        renderItem={(item, index, onItemChange) => {
          const row = /** @type {{ question?: string, answer?: string }} */ (item)
          return (
            <>
              <EditorField id={`faq-question-${index}`} label="Question">
                <input
                  id={`faq-question-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.question ?? ''}
                  onChange={(e) => onItemChange({ ...row, question: e.target.value })}
                />
              </EditorField>

              <EditorField id={`faq-answer-${index}`} label="Answer">
                <textarea
                  id={`faq-answer-${index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={row.answer ?? ''}
                  onChange={(e) => onItemChange({ ...row, answer: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
