import React from 'react'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function StatsEditor({ section, onConfigChange, panelId, labelledBy }) {
  const config = section.config ?? {}
  const stats = Array.isArray(config.stats) ? config.stats : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Stats"
      description="Animated counters displayed in the stats band on the homepage."
    >
      <EditorList
        label="Statistics"
        itemLabel="Stat"
        items={stats}
        onChange={(next) => onConfigChange('stats', next)}
        createItem={() => ({ value: 0, suffix: '', label: '' })}
        renderItem={(item, _index, onItemChange) => {
          const stat = /** @type {{ value?: number, suffix?: string, label?: string }} */ (item)
          return (
            <>
              <EditorField id={`stat-value-${_index}`} label="Value">
                <input
                  id={`stat-value-${_index}`}
                  type="number"
                  className="admin-settings-input"
                  value={stat.value ?? 0}
                  onChange={(e) =>
                    onItemChange({ ...stat, value: Number.parseInt(e.target.value, 10) || 0 })
                  }
                />
              </EditorField>

              <EditorField id={`stat-suffix-${_index}`} label="Suffix">
                <input
                  id={`stat-suffix-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={stat.suffix ?? ''}
                  onChange={(e) => onItemChange({ ...stat, suffix: e.target.value })}
                  placeholder="+, %, etc."
                />
              </EditorField>

              <EditorField id={`stat-label-${_index}`} label="Label">
                <input
                  id={`stat-label-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={stat.label ?? ''}
                  onChange={(e) => onItemChange({ ...stat, label: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
