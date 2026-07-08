import { useEffect, useCallback } from 'react'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

let scriptPromise = null

function loadRecaptchaScript() {
  if (!SITE_KEY) return Promise.resolve(null)
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha-v3]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.grecaptcha))
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.defer = true
    script.dataset.recaptchaV3 = 'true'
    script.onload = () => resolve(window.grecaptcha)
    script.onerror = reject
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function useRecaptcha() {
  useEffect(() => {
    loadRecaptchaScript().catch(() => {})
  }, [])

  const executeRecaptcha = useCallback(async (action = 'inquiry_submit') => {
    if (!SITE_KEY) {
      if (import.meta.env.DEV) {
        console.warn('[reCAPTCHA] Set VITE_RECAPTCHA_SITE_KEY in .env for production protection.')
      }
      return null
    }

    const grecaptcha = await loadRecaptchaScript()
    if (!grecaptcha?.execute) {
      throw new Error('reCAPTCHA failed to load. Please refresh and try again.')
    }

    return new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(SITE_KEY, { action })
          .then(resolve)
          .catch(reject)
      })
    })
  }, [])

  return { executeRecaptcha, isConfigured: Boolean(SITE_KEY) }
}
