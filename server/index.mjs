import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { verifyTurnstileToken } from './verifyTurnstile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

dotenv.config({ path: join(root, '.env.local') })
dotenv.config({ path: join(root, '.env') })

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/turnstile/verify', async (req, res) => {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Turnstile secret key is not configured on the server.',
    })
  }

  const token = req.body?.token

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Token is required.',
    })
  }

  try {
    const result = await verifyTurnstileToken(token, secret)
    return res.status(result.success ? 200 : 403).json(result)
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Turnstile verification failed.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Turnstile API listening on http://localhost:${PORT}`)
})
