import React from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

/**
 * Repeatable list editor for section config arrays.
 * @param {{
 *   label: string,
 *   items: unknown[],
 *   onChange: (items: unknown[]) => void,
 *   createItem: () => unknown,
 *   itemLabel?: string,
 *   reorderable?: boolean,
 *   renderItem: (item: unknown, index: number, onItemChange: (next: unknown) => void) => React.ReactNode,
 * }} props
 */
export default function EditorList({
  label,
  items,
  onChange,
  createItem,
  itemLabel = 'Item',
  reorderable = false,
  renderItem,
}) {
  const handleItemChange = (index, nextItem) => {
    onChange(items.map((item, i) => (i === index ? nextItem : item)))
  }

  const handleAdd = () => {
    onChange([...items, createItem()])
  }

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleMove = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    onChange(next)
  }

  return (
    <div className="admin-home-list">
      <div className="admin-home-list-header">
        <span className="admin-settings-label">{label}</span>
        <button type="button" className="admin-home-list-add" onClick={handleAdd}>
          <Plus size={14} strokeWidth={1.75} aria-hidden />
          Add {itemLabel}
        </button>
      </div>

      {items.length === 0 && <p className="admin-settings-hint">No items yet.</p>}

      <ul className="admin-home-list-items">
        {items.map((item, index) => (
          <li key={index} className="admin-home-list-item">
            <div className="admin-home-list-item-head">
              <span className="admin-home-list-item-label">
                {itemLabel} {index + 1}
              </span>
              <div className="admin-home-list-item-actions">
                {reorderable && (
                  <>
                    <button
                      type="button"
                      className="admin-home-list-move"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${itemLabel} ${index + 1} up`}
                    >
                      <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="admin-home-list-move"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move ${itemLabel} ${index + 1} down`}
                    >
                      <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="admin-home-list-remove"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${itemLabel} ${index + 1}`}
                >
                  <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </div>
            <div className="admin-home-list-item-body">
              {renderItem(item, index, (next) => handleItemChange(index, next))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
