'use client'

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Custom service dropdown that portals the menu so it is never clipped by
 * parent overflow, and uses pointer events that work on touch devices.
 */
export default function ServiceSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select a service',
  error,
  required,
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(/** @type {React.CSSProperties | null} */ (null))
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const menuRef = useRef(/** @type {HTMLUListElement | null} */ (null))
  const listId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setMenuStyle(null)
  }, [])

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const gap = 6
    const maxMenuH = Math.min(16 * 16, viewportH * 0.45)
    const spaceBelow = viewportH - rect.bottom - gap - 12
    const spaceAbove = rect.top - gap - 12
    const openUpward = spaceBelow < Math.min(maxMenuH, 220) && spaceAbove > spaceBelow
    const available = Math.max(140, openUpward ? spaceAbove : spaceBelow)
    const height = Math.min(maxMenuH, available)
    const width = Math.min(rect.width, viewportW - 24)
    const left = Math.min(Math.max(12, rect.left), viewportW - width - 12)

    setMenuStyle({
      position: 'fixed',
      left,
      width,
      zIndex: 4000,
      maxHeight: height,
      ...(openUpward
        ? { bottom: viewportH - rect.top + gap, top: 'auto' }
        : { top: rect.bottom + gap, bottom: 'auto' }),
    })
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
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      const target = /** @type {Node | null} */ (event.target)
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      closeMenu()
    }

    const onKey = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeMenu])

  const selectOption = (opt) => {
    onChange(opt)
    closeMenu()
  }

  const toggleOpen = () => {
    if (open) {
      closeMenu()
      return
    }
    updateMenuPosition()
    setOpen(true)
  }

  const menu = (
    <AnimatePresence>
      {open && menuStyle ? (
        <motion.ul
          ref={menuRef}
          id={listId}
          role="listbox"
          className="inquiry-select-menu inquiry-select-menu--portal"
          style={menuStyle}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {options.map((opt) => (
            <li key={opt} role="option" aria-selected={value === opt}>
              <button
                type="button"
                className={`inquiry-select-option ${value === opt ? 'is-selected' : ''}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => selectOption(opt)}
              >
                <span>{opt}</span>
                {value === opt ? <Check size={16} aria-hidden /> : null}
              </button>
            </li>
          ))}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  )

  return (
    <div className={`inquiry-field inquiry-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <label className="inquiry-label" htmlFor={id}>
        {label}
        {required ? <span className="inquiry-required">*</span> : null}
      </label>

      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`inquiry-select-trigger ${open ? 'is-open' : ''} ${error ? 'has-error' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggleOpen}
      >
        <span className={value ? 'inquiry-select-value' : 'inquiry-select-placeholder'}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className="inquiry-select-chevron" aria-hidden />
      </button>

      {mounted ? createPortal(menu, document.body) : null}

      {error ? (
        <p className="inquiry-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
