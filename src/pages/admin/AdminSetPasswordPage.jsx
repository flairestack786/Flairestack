import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { acceptUserInvite } from '../../lib/adminApi'
import { supabase } from '../../lib/supabase'
import '../../admin-auth.css'

const MIN_PASSWORD_LENGTH = 8

/**
 * First-time invite / password-recovery setup.
 * Requires an authenticated Supabase session from the email link.
 * Must not be wrapped in GuestRoute (invitees already have a session).
 */
export default function AdminSetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading, refreshProfile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    /** @type {Record<string, string>} */
    const next = {}
    if (!password) {
      next.password = 'Password is required.'
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password.'
    } else if (password && confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match.'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccess(false)

    if (!session) {
      setFormError('Your invitation session expired. Please request a new invite or sign in.')
      return
    }

    if (!validate()) return

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Mark matching pending invite accepted and activate profile (password-reset with no invite returns skipped OK).
      try {
        await acceptUserInvite()
        await refreshProfile()
      } catch (acceptErr) {
        throw new Error(
          acceptErr?.message
            ? `Password saved, but invitation could not be completed: ${acceptErr.message}`
            : 'Password saved, but invitation could not be completed. Please contact an administrator.'
        )
      }

      setSuccess(true)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setFormError(err?.message || 'Unable to set your password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-auth-page" role="status" aria-live="polite">
        <div className="admin-auth-loading">
          <span className="admin-auth-spinner" aria-hidden />
          <span>Checking session…</span>
        </div>
      </div>
    )
  }

  if (!session) {
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
            <h1 className="admin-auth-title">Set Your Password</h1>
            <p className="admin-auth-subtitle">
              This page is only available from a valid invitation or password-reset link. Open the
              link from your email, or sign in if you already have an account.
            </p>
            <div className="admin-auth-error" role="alert">
              No active session found. Your invite link may have expired or already been used.
            </div>
            <Link to="/admin/login" className="admin-auth-submit" style={{ textDecoration: 'none' }}>
              Go to sign in
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <p className="admin-auth-footer">
            <Link to="/" className="admin-auth-back">
              ← Back to website
            </Link>
          </p>
        </motion.div>
      </div>
    )
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
          <h1 className="admin-auth-title">Set Your Password</h1>
          <p className="admin-auth-subtitle">
            Create a password for your FlaireStack CMS account. You will use this to sign in next
            time.
          </p>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="admin-auth-error" role="alert">
                {formError}
              </div>
            )}
            {success && (
              <div className="admin-auth-error" role="status" style={{ borderColor: 'rgba(34, 197, 94, 0.45)' }}>
                Password saved. Redirecting…
              </div>
            )}

            <label className="admin-auth-field">
              <span className="admin-auth-label">Password</span>
              <span className="admin-auth-input-wrap">
                <Lock size={18} className="admin-auth-input-icon" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  placeholder="••••••••"
                  className="admin-auth-input admin-auth-input--password"
                  disabled={submitting}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  className="admin-auth-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {fieldErrors.password && (
                <span className="admin-auth-error" style={{ marginTop: '0.5rem' }}>
                  {fieldErrors.password}
                </span>
              )}
            </label>

            <label className="admin-auth-field">
              <span className="admin-auth-label">Confirm Password</span>
              <span className="admin-auth-input-wrap">
                <Lock size={18} className="admin-auth-input-icon" aria-hidden />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }}
                  placeholder="••••••••"
                  className="admin-auth-input admin-auth-input--password"
                  disabled={submitting}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  className="admin-auth-toggle-pw"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                  disabled={submitting}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {fieldErrors.confirmPassword && (
                <span className="admin-auth-error" style={{ marginTop: '0.5rem' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </label>

            <button type="submit" className="admin-auth-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Set Password'}
              {!submitting && <ArrowRight size={18} aria-hidden />}
            </button>
          </form>
        </div>

        <p className="admin-auth-footer">
          <Link to="/" className="admin-auth-back">
            ← Back to website
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
