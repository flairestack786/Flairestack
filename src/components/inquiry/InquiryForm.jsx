import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import emailjs from '@emailjs/browser'
import { inquiryServiceOptions } from '../../data/inquiryServices'
import ServiceSelect from './ServiceSelect'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const EMAILJS_TO_EMAIL = import.meta.env.VITE_EMAILJS_TO_EMAIL || 'info@flairestack.com'
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const initial = {
  fullName: '',
  email: '',
  company: '',
  phone: '',
  service: '',
  message: '',
}

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

function validate(values) {
  const errors = {}
  if (!values.fullName.trim()) errors.fullName = 'Please enter your full name.'
  if (!values.email.trim()) {
    errors.email = 'Please enter your email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  
  if (!values.phone.trim()) errors.phone = 'Please enter a phone number.'
  if (!values.service) errors.service = 'Please select a service.'
  if (!values.message.trim()) errors.message = 'Please tell us about your project.'
  else if (values.message.trim().length < 20) {
    errors.message = 'Please provide at least 20 characters about your project.'
  }
  return errors
}

async function verifyTurnstileWithServer(token) {
  let response
  try {
    response = await fetch(`${API_BASE}/api/turnstile/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    throw new Error(
      'Unable to reach the verification server. Run "npm run dev" to start the API, or check VITE_API_BASE_URL.'
    )
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('Invalid response from verification server.')
  }

  if (!response.ok || !result.success) {
    throw new Error('Security verification failed. Please try again.')
  }

  return result
}

export default function InquiryForm() {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)

  const set = (key) => (e) => {
    const v = e?.target ? e.target.value : e
    setValues((prev) => ({ ...prev, [key]: v }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSubmitError('')
  }

  const resetTurnstile = () => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setSubmitError('Inquiry service is temporarily unavailable. Please try again in a moment.')
      return
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError('Please complete the security verification before sending.')
      return
    }

    setStatus('submitting')
    setSubmitError('')

    try {
      if (TURNSTILE_SITE_KEY) {
        await verifyTurnstileWithServer(turnstileToken)
      }

      const templateParams = {
        name: values.fullName,
        email: values.email,
        company: values.company,
        phone: values.phone,
        service: values.service,
        message: values.message,
        to_email: EMAILJS_TO_EMAIL,
        turnstile_token: turnstileToken || '',
        submitted_at: new Date().toISOString(),
      }
        // console.log(templateParams);
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )

      if (result?.status !== 200) {
        throw new Error('Unable to send your inquiry. Please try again.')
      }

      setStatus('success')
      setValues(initial)
      resetTurnstile()
    } catch (err) {
      setStatus('idle')
      setSubmitError(err.message || 'Something went wrong. Please try again.')
      resetTurnstile()
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        className="inquiry-form inquiry-form--success"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <p className="inquiry-success-eyebrow">Inquiry received</p>
        <h3 className="inquiry-success-title">Thank you — we&apos;ll be in touch shortly.</h3>
        <p className="inquiry-success-text">
          A FlaireStack specialist will review your project details and respond within one business
          day.
        </p>
        <button
          type="button"
          className="inquiry-submit"
          onClick={() => {
            setStatus('idle')
            resetTurnstile()
          }}
        >
          Send another inquiry
        </button>
      </motion.div>
    )
  }

  return (
    <motion.form
      className="inquiry-form"
      onSubmit={handleSubmit}
      noValidate
      variants={formVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      <div className="inquiry-form-grid">
        <motion.div className="inquiry-field" variants={fieldVariants}>
          <label className="inquiry-label" htmlFor="inquiry-name">
            Full Name<span className="inquiry-required">*</span>
          </label>
          <input
            id="inquiry-name"
            type="text"
            name="fullName"
            autoComplete="name"
            className={`inquiry-input ${errors.fullName ? 'has-error' : ''}`}
            placeholder="Jane Smith"
            value={values.fullName}
            onChange={set('fullName')}
          />
          {errors.fullName && <p className="inquiry-error">{errors.fullName}</p>}
        </motion.div>

        <motion.div className="inquiry-field" variants={fieldVariants}>
          <label className="inquiry-label" htmlFor="inquiry-email">
            Email Address<span className="inquiry-required">*</span>
          </label>
          <input
            id="inquiry-email"
            type="email"
            name="email"
            autoComplete="email"
            className={`inquiry-input ${errors.email ? 'has-error' : ''}`}
            placeholder="you@company.com"
            value={values.email}
            onChange={set('email')}
          />
          {errors.email && <p className="inquiry-error">{errors.email}</p>}
        </motion.div>

        <motion.div className="inquiry-field" variants={fieldVariants}>
          <label className="inquiry-label" htmlFor="inquiry-company">
            Company Name(Optional)
          </label>
          <input
            id="inquiry-company"
            type="text"
            name="company"
            autoComplete="organization"
            className={`inquiry-input ${errors.company ? 'has-error' : ''}`}
            placeholder="Acme Inc."
            value={values.company}
            onChange={set('company')}
          />
          {errors.company && <p className="inquiry-error">{errors.company}</p>}
        </motion.div>

        <motion.div className="inquiry-field" variants={fieldVariants}>
          <label className="inquiry-label" htmlFor="inquiry-phone">
            Phone Number<span className="inquiry-required">*</span>
          </label>
          <input
            id="inquiry-phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            className={`inquiry-input ${errors.phone ? 'has-error' : ''}`}
            placeholder="+1 (555) 000-0000"
            value={values.phone}
            onChange={set('phone')}
          />
          {errors.phone && <p className="inquiry-error">{errors.phone}</p>}
        </motion.div>

        <motion.div className="inquiry-field--full" variants={fieldVariants}>
          <ServiceSelect
            id="inquiry-service"
            label="Select Service"
            value={values.service}
            onChange={set('service')}
            options={inquiryServiceOptions}
            error={errors.service}
            required
          />
        </motion.div>

        <motion.div className="inquiry-field inquiry-field--full" variants={fieldVariants}>
          <label className="inquiry-label" htmlFor="inquiry-message">
            Project Details<span className="inquiry-required">*</span>
          </label>
          <textarea
            id="inquiry-message"
            name="message"
            rows={5}
            className={`inquiry-input inquiry-textarea ${errors.message ? 'has-error' : ''}`}
            placeholder="Tell us about your goals, timeline, and technical requirements…"
            value={values.message}
            onChange={set('message')}
          />
          {errors.message && <p className="inquiry-error">{errors.message}</p>}
        </motion.div>
      </div>

      {submitError && (
        <p className="inquiry-form-error" role="alert">
          {submitError}
        </p>
      )}

      <motion.div className="inquiry-form-footer" variants={fieldVariants}>
        {TURNSTILE_SITE_KEY && (
          <div className="inquiry-turnstile-wrap">
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
              onError={() => {
                setTurnstileToken('')
                setSubmitError('Security verification failed. Please try again.')
              }}
              options={{
                theme: 'dark',
                size: 'flexible',
              }}
            />
          </div>
        )}

        <motion.button
          type="submit"
          className="inquiry-submit"
          disabled={status === 'submitting'}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={18} className="inquiry-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              Send Inquiry
              <ArrowRight size={18} aria-hidden />
            </>
          )}
        </motion.button>
        <p className="inquiry-recaptcha-note">
          Protected by Cloudflare Turnstile
          {TURNSTILE_SITE_KEY ? '' : ' — add VITE_TURNSTILE_SITE_KEY to enable'}.
        </p>
      </motion.div>
    </motion.form>
  )
}