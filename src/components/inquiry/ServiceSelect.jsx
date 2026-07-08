import React, { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

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
  const rootRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const selectOption = (opt) => {
    onChange(opt)
    setOpen(false)
  }

  return (
    <div className="inquiry-field" ref={rootRef}>
      <label className="inquiry-label" htmlFor={id}>
        {label}
        {required && <span className="inquiry-required">*</span>}
      </label>

      <button
        type="button"
        id={id}
        className={`inquiry-select-trigger ${open ? 'is-open' : ''} ${error ? 'has-error' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? 'inquiry-select-value' : 'inquiry-select-placeholder'}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className="inquiry-select-chevron" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            className="inquiry-select-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map((opt) => (
              <li key={opt} role="option" aria-selected={value === opt}>
                <button
                  type="button"
                  className={`inquiry-select-option ${value === opt ? 'is-selected' : ''}`}
                  onClick={() => selectOption(opt)}
                >
                  <span>{opt}</span>
                  {value === opt && <Check size={16} aria-hidden />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p className="inquiry-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
