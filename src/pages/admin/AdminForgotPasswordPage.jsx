import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import '../../admin-auth.css'

const GENERIC_SUCCESS =
  "If an account exists for this email address, you'll receive a password reset link shortly."

/**
 * Self-service password reset request.
 * Uses Supabase Auth resetPasswordForEmail — no service role, no account enumeration.
 */
export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldError('')
    setFormError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`
      // Always show a generic success message to avoid account enumeration.
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (error && /rate limit|too many/i.test(error.message)) {
        setFormError('Too many reset attempts. Please wait a few minutes and try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-bg" aria-hidden>
        <div className="admin-auth-bg-grid" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--a" />
        <div className="admin-auth-bg-orb admin-auth-bg-orb--b" />
      </div>

      <motion.div
        className="admin-auth-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="admin-auth-brand">
          <Link to="/" className="admin-auth-logo">
            <span className="admin-auth-logo-text">FlaireStack</span>
            <span className="admin-auth-logo-accent" aria-hidden />
          </Link>
          <p className="admin-auth-badge">Admin Portal</p>
        </header>

        <div className="admin-auth-card">
          <h1 className="admin-auth-title">Forgot your password?</h1>
          <p className="admin-auth-subtitle">
            Enter the email address associated with your FlaireStack account and we&apos;ll send you
            a link to reset your password.
          </p>

          {submitted ? (
            <div className="admin-auth-form">
              <div
                className="admin-auth-error"
                role="status"
                style={{ borderColor: 'rgba(34, 197, 94, 0.45)' }}
              >
                {GENERIC_SUCCESS}
              </div>
              <Link
                to="/admin/login"
                className="admin-auth-submit"
                style={{ textDecoration: 'none' }}
              >
                Back to login
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          ) : (
            <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <div className="admin-auth-error" role="alert">
                  {formError}
                </div>
              )}

              <label className="admin-auth-field">
                <span className="admin-auth-label">Email address</span>
                <span className="admin-auth-input-wrap">
                  <Mail size={18} className="admin-auth-input-icon" aria-hidden />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setFieldError('')
                    }}
                    placeholder="you@flairestack.com"
                    className="admin-auth-input"
                    disabled={submitting}
                    required
                  />
                </span>
                {fieldError && (
                  <span className="admin-auth-error" style={{ marginTop: '0.5rem' }}>
                    {fieldError}
                  </span>
                )}
              </label>

              <button type="submit" className="admin-auth-submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
                {!submitting && <ArrowRight size={18} aria-hidden />}
              </button>
            </form>
          )}
        </div>

        <p className="admin-auth-footer">
          <Link to="/admin/login" className="admin-auth-back">
            ← Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
