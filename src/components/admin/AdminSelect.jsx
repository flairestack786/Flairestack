import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Themed dropdown for admin filters and forms (replaces native select).
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: { value: string, label: string }[],
 *   placeholder?: string,
 *   'aria-label'?: string,
 *   disabled?: boolean,
 *   className?: string,
 * }} props
 */
export default function AdminSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  'aria-label': ariaLabel,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState(/** @type {React.CSSProperties} */ ({}))
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const menuRef = useRef(/** @type {HTMLUListElement | null} */ (null))
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  const updateMenuPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 220 && rect.top > spaceBelow

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      zIndex: 6100,
    })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    updateMenuPosition()

    const onReposition = () => updateMenuPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const onDoc = (event) => {
      const target = /** @type {Node | null} */ (event.target)
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSelect = (nextValue) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={`admin-select${open ? ' admin-select--open' : ''}${disabled ? ' admin-select--disabled' : ''} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="admin-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!disabled) setOpen((current) => !current)
        }}
      >
        <span className={selected ? 'admin-select-value' : 'admin-select-placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} strokeWidth={1.75} className="admin-select-chevron" aria-hidden />
      </button>

      {mounted && open
        ? createPortal(
            <ul
              ref={menuRef}
              id={listId}
              role="listbox"
              className="admin-select-menu"
              style={menuStyle}
              aria-label={ariaLabel}
            >
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`admin-select-option${isSelected ? ' admin-select-option--selected' : ''}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check size={15} strokeWidth={2} aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  )
}
