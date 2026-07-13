import './loadEnv.mjs'
import express from 'express'
import cors from 'cors'
import { verifyTurnstileToken } from './verifyTurnstile.js'
import adminUsersRouter from './routes/adminUsers.mjs'

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

app.use('/api/admin', adminUsersRouter)

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
