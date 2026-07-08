import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../admin-auth.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.')
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
          <h1 className="admin-auth-title">Sign in</h1>
          <p className="admin-auth-subtitle">
            Secure access for authorized FlaireStack administrators.
          </p>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="admin-auth-error" role="alert">
                {error}
              </div>
            )}

            <label className="admin-auth-field">
              <span className="admin-auth-label">Email</span>
              <span className="admin-auth-input-wrap">
                <Mail size={18} className="admin-auth-input-icon" aria-hidden />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@flairestack.com"
                  className="admin-auth-input"
                  disabled={submitting}
                  required
                />
              </span>
            </label>

            <label className="admin-auth-field">
              <span className="admin-auth-label">Password</span>
              <span className="admin-auth-input-wrap">
                <Lock size={18} className="admin-auth-input-icon" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="admin-auth-input admin-auth-input--password"
                  disabled={submitting}
                  required
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
            </label>

            <button type="submit" className="admin-auth-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
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
