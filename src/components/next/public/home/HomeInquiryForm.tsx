'use client'

import { useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import emailjs from '@emailjs/browser'
import { inquiryServiceOptions } from '@/data/inquiryServices'
import ServiceSelect from '@/components/inquiry/ServiceSelect'
import {
  buildInquiryEmailJsTemplateParams,
  formatInquiryEmailJsFailure,
  isInquiryEmailJsSuccess,
  resolveInquiryEmailConfig,
} from '@/lib/inquiryEmailConfig'
import { submitInquiry } from '@/lib/inquiryClientFlow'

type HomeInquiryFormProps = {
  serviceOptions?: string[]
}

const INQUIRY_EMAIL = resolveInquiryEmailConfig()
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

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

function validate(values: typeof initial) {
  const errors: Record<string, string> = {}
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

/** Exactly one customer confirmation via the inquiry template. No business notification. */
async function sendCustomerConfirmation(values: typeof initial): Promise<boolean> {
  if (!INQUIRY_EMAIL.configured) {
    console.error(
      '[HomeInquiryForm] EmailJS customer confirmation skipped — missing',
      INQUIRY_EMAIL.missing.join(', ')
    )
    return false
  }

  const templateParams = buildInquiryEmailJsTemplateParams({
    fullName: values.fullName,
    email: values.email,
    company: values.company,
    phone: values.phone,
    service: values.service,
    message: values.message,
  })

  try {
    const result = await emailjs.send(
      INQUIRY_EMAIL.serviceId,
      INQUIRY_EMAIL.templateId,
      templateParams,
      { publicKey: INQUIRY_EMAIL.publicKey }
    )
    if (!isInquiryEmailJsSuccess(result)) {
      console.error('[HomeInquiryForm] EmailJS customer confirmation rejected', {
        serviceId: INQUIRY_EMAIL.serviceId,
        templateId: INQUIRY_EMAIL.templateId,
        status: result?.status ?? null,
        text: String(result?.text || '').slice(0, 240),
      })
      return false
    }
    return true
  } catch (emailErr) {
    const details = formatInquiryEmailJsFailure(emailErr)
    console.error('[HomeInquiryForm] EmailJS customer confirmation failed', {
      serviceId: INQUIRY_EMAIL.serviceId,
      templateId: INQUIRY_EMAIL.templateId,
      status: details.status,
      text: details.text,
    })
    return false
  }
}

/**
 * Public inquiry form.
 * Flow: validate → POST /api/inquiry/submit (server Turnstile verify + lead insert)
 * → customer confirmation email only after the server confirms the save.
 */
export default function HomeInquiryForm({ serviceOptions }: HomeInquiryFormProps) {
  const options =
    Array.isArray(serviceOptions) && serviceOptions.length > 0
      ? serviceOptions
      : inquiryServiceOptions
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<{ reset: () => void } | null>(null)

  const set =
    (key: keyof typeof initial) =>
    (e: { target?: { value: string } } | string) => {
      const v = typeof e === 'string' ? e : e?.target ? e.target.value : ''
      setValues((prev) => ({ ...prev, [key]: v }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
      setSubmitError('')
    }

  const resetTurnstile = () => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError('Please complete the security verification before sending.')
      return
    }

    setStatus('submitting')
    setSubmitError('')

    const submitted = { ...values }
    const result = await submitInquiry({
      values: submitted,
      turnstileToken,
      sendConfirmation: () => sendCustomerConfirmation(submitted),
    })

    // Turnstile tokens are single-use; always request a fresh one.
    resetTurnstile()

    if (!result.ok) {
      setStatus('idle')
      if (result.fieldErrors) setErrors(result.fieldErrors)
      setSubmitError(result.error)
      return
    }

    setStatus('success')
    setValues(initial)
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
            disabled={status === 'submitting'}
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
            disabled={status === 'submitting'}
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
            disabled={status === 'submitting'}
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
            disabled={status === 'submitting'}
          />
          {errors.phone && <p className="inquiry-error">{errors.phone}</p>}
        </motion.div>

        <motion.div className="inquiry-field--full" variants={fieldVariants}>
          <ServiceSelect
            id="inquiry-service"
            label="Select Service"
            value={values.service}
            onChange={set('service')}
            options={options}
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
            disabled={status === 'submitting'}
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
        {TURNSTILE_SITE_KEY ? (
          <div className="inquiry-turnstile-wrap">
            <Turnstile
              ref={turnstileRef as never}
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
        ) : null}

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
          {TURNSTILE_SITE_KEY ? '' : ' — add NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable'}.
        </p>
      </motion.div>
    </motion.form>
  )
}
