'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useNextAuth } from '@/lib/next/NextAuthProvider'
import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import '@/admin-auth.css'

const MIN_PASSWORD_LENGTH = 8

const INVALID_RECOVERY_MESSAGE =
  'Your password reset session is invalid or has expired. Please request a new password reset link.'

/**
 * Phase 14: full password-recovery completion page (replaces placeholder).
 * Requires a PASSWORD_RECOVERY session — never grants CMS access.
 * Must not be wrapped in NextGuestGate / NextProtectedGate.
 */
export default function AdminResetPasswordPage() {
  const router = useRouter()
  const { session, loading, isPasswordRecovery, signOut, clearPasswordRecovery } = useNextAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [returningToLogin, setReturningToLogin] = useState(false)

  const handleBackToLogin = async (e?: FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    if (returningToLogin) return
    setReturningToLogin(true)
    try {
      await signOut()
    } catch {
      // Clear recovery first, then force a local Auth logout so GuestGate
      // cannot treat a leftover JWT as a normal CMS login (Vite parity).
      clearPasswordRecovery()
      try {
        await getSupabaseBrowser().auth.signOut()
      } catch {
        // Ignore — navigation still targets the login screen.
      }
    } finally {
      router.replace('/admin/login')
      setReturningToLogin(false)
    }
  }

  useEffect(() => {
    if (loading) return undefined

    if (session && isPasswordRecovery) {
      setRecoveryReady(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setRecoveryReady(true)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [loading, session, isPasswordRecovery])

  const canUpdatePassword = Boolean(session && isPasswordRecovery)

  const validate = () => {
    const next: Record<string, string> = {}
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!canUpdatePassword) {
      setFormError(INVALID_RECOVERY_MESSAGE)
      return
    }

    if (!validate()) return

    setSubmitting(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      clearPasswordRecovery()

      try {
        await signOut()
      } catch {
        // Password already updated; continue to success even if sign-out fails.
      }

      setSuccess(true)
      window.setTimeout(() => {
        router.replace('/admin/login')
      }, 2500)
    } catch (err) {
      const message = String(err instanceof Error ? err.message : '')
      if (/session|expired|invalid/i.test(message)) {
        setFormError(INVALID_RECOVERY_MESSAGE)
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
            <Link href="/" className="admin-auth-logo">
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
            <Link href="/admin/login" className="admin-auth-submit" style={{ textDecoration: 'none' }}>
              Return to login
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!canUpdatePassword) {
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
            <Link href="/" className="admin-auth-logo">
              <span className="admin-auth-logo-text">FlaireStack</span>
              <span className="admin-auth-logo-accent" aria-hidden />
            </Link>
            <p className="admin-auth-badge">Admin Portal</p>
          </header>

          <div className="admin-auth-card">
            <h1 className="admin-auth-title">Reset link expired</h1>
            <p className="admin-auth-subtitle">{INVALID_RECOVERY_MESSAGE}</p>
            <div className="admin-auth-error" role="alert">
              No valid password recovery session found.
            </div>
            <Link
              href="/admin/forgot-password"
              className="admin-auth-submit"
              style={{ textDecoration: 'none' }}
            >
              Request a new reset link
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <p className="admin-auth-footer">
            <button
              type="button"
              className="admin-auth-back"
              onClick={handleBackToLogin}
              disabled={returningToLogin}
            >
              {returningToLogin ? 'Signing out…' : '← Back to login'}
            </button>
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
          <Link href="/" className="admin-auth-logo">
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
                  disabled={submitting || returningToLogin}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  className="admin-auth-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={submitting || returningToLogin}
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
                  disabled={submitting || returningToLogin}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  className="admin-auth-toggle-pw"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                  disabled={submitting || returningToLogin}
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

            <button
              type="submit"
              className="admin-auth-submit"
              disabled={submitting || returningToLogin}
            >
              {submitting ? 'Updating…' : 'Update password'}
              {!submitting && <ArrowRight size={18} aria-hidden />}
            </button>
          </form>
        </div>

        <p className="admin-auth-footer">
          <button
            type="button"
            className="admin-auth-back"
            onClick={handleBackToLogin}
            disabled={returningToLogin}
          >
            {returningToLogin ? 'Signing out…' : '← Back to login'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
