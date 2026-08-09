import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import '../../admin-auth.css'

const MIN_PASSWORD_LENGTH = 8

/**
 * Password recovery completion page.
 * Requires a valid Supabase recovery session from the email link.
 * Must not be wrapped in GuestRoute.
 */
export default function AdminResetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)

  // Wait briefly for detectSessionInUrl / PASSWORD_RECOVERY to establish session.
  useEffect(() => {
    if (loading) return undefined

    if (session) {
      setRecoveryReady(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setRecoveryReady(true)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [loading, session])

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

    if (!session) {
      setFormError(
        'This password reset link is invalid or has expired. Please request a new password reset link.'
      )
      return
    }

    if (!validate()) return

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      try {
        await signOut()
      } catch {
        // Password already updated; continue to success even if sign-out fails.
      }

      setSuccess(true)
      window.setTimeout(() => {
        navigate('/admin/login', { replace: true })
      }, 2500)
    } catch (err) {
      const message = String(err?.message ?? '')
      if (/session|expired|invalid/i.test(message)) {
        setFormError(
          'This password reset link is invalid or has expired. Please request a new password reset link.'
        )
      } else {
        setFormError('Unable to update your password. Please try again or request a new reset link.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !recoveryReady) {
    return (
      <div className="admin-auth-page" role="status" aria-live="polite">
        <div className="admin-auth-loading">
          <span className="admin-auth-spinner" aria-hidden />
          <span>Checking reset link…</span>
        </div>
      </div>
    )
  }

  if (success) {
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
            <h1 className="admin-auth-title">Password updated</h1>
            <p className="admin-auth-subtitle">
              Your password has been successfully updated. You can now sign in with your new
              password.
            </p>
            <Link to="/admin/login" className="admin-auth-submit" style={{ textDecoration: 'none' }}>
              Return to login
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </motion.div>
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
            <h1 className="admin-auth-title">Reset link expired</h1>
            <p className="admin-auth-subtitle">
              This password reset link is invalid or has expired. Please request a new password
              reset link.
            </p>
            <div className="admin-auth-error" role="alert">
              No valid recovery session found.
            </div>
            <Link
              to="/admin/forgot-password"
              className="admin-auth-submit"
              style={{ textDecoration: 'none' }}
            >
              Request a new reset link
              <ArrowRight size={18} aria-hidden />
            </Link>
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
          <h1 className="admin-auth-title">Reset your password</h1>
          <p className="admin-auth-subtitle">
            Enter a new password for your FlaireStack account. Use at least {MIN_PASSWORD_LENGTH}{' '}
            characters.
          </p>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="admin-auth-error" role="alert">
                {formError}
              </div>
            )}

            <label className="admin-auth-field">
              <span className="admin-auth-label">New password</span>
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
              <span className="admin-auth-label">Confirm new password</span>
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
              {submitting ? 'Updating…' : 'Update password'}
              {!submitting && <ArrowRight size={18} aria-hidden />}
            </button>
          </form>
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
