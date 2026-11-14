import fs from 'node:fs'
import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      const k = l.slice(0, i)
      const v = l.slice(i + 1).replace(/^["']|["']$/g, '')
      return [k, v]
    })
)

const serviceId = env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID
const templateId = env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID
const publicKey = env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY
const toEnv = env.NEXT_PUBLIC_EMAILJS_TO_EMAIL || env.VITE_EMAILJS_TO_EMAIL || null
const customerEmail = `debug.customer+${Date.now()}@example.com`

const params = {
  name: 'Debug Tester',
  email: customerEmail,
  company: 'Debug Co',
  phone: '+15550001111',
  service: 'Web Development',
  message: 'Debug inquiry confirmation delivery test.',
  to_email: customerEmail,
  reply_to: 'hello@flairestack.com',
  from_name: 'FlaireStack',
  from_email: 'hello@flairestack.com',
  turnstile_token: '',
  submitted_at: new Date().toISOString(),
}

const logPath = path.join('.cursor', 'debug-e489f1.log')
mkdirSync(path.dirname(logPath), { recursive: true })

function write(hypothesisId, location, message, data) {
  appendFileSync(
    logPath,
    `${JSON.stringify({
      sessionId: 'e489f1',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    })}\n`
  )
}

write('D', 'debug-inquiry-emailjs-probe:config', 'Local EmailJS config before probe send', {
  serviceId,
  templateId,
  publicKeyLen: (publicKey || '').length,
  toEnv,
  customerDomain: customerEmail.split('@')[1],
  emailIsInfo: false,
  toEmailEqualsEmail: params.to_email === params.email,
  replyTo: params.reply_to,
  fromEmail: params.from_email,
  paramKeys: Object.keys(params),
})

const body = {
  service_id: serviceId,
  template_id: templateId,
  user_id: publicKey,
  template_params: params,
}

const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
const text = await res.text()

write('C', 'debug-inquiry-emailjs-probe:response', 'EmailJS REST probe response', {
  httpStatus: res.status,
  ok: res.ok,
  text: String(text).slice(0, 240),
  serviceId,
  templateId,
  recipientDomain: customerEmail.split('@')[1],
  emailParamPresent: true,
})

console.log(
  JSON.stringify({
    httpStatus: res.status,
    ok: res.ok,
    text: String(text).slice(0, 240),
    serviceId,
    templateId,
    toEnv,
  })
)
