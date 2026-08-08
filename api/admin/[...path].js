import express from 'express'
import adminUsersRouter from '../../server/routes/adminUsers.mjs'

/**
 * Vercel Serverless catch-all for /api/admin/*
 *
 * Reuses the same Express router as local development (server/index.mjs →
 * server/routes/adminUsers.mjs), including requireAdministrator and
 * service-role Supabase Auth Admin operations.
 *
 * Local: Vite proxies /api → Express on :3001 (this file is unused).
 * Production: Vercel invokes this function for /api/admin/**.
 */

const app = express()

app.use(express.json())

// Full path as sent by the browser (and by some Vercel runtimes).
app.use('/api/admin', adminUsersRouter)

// When the catch-all strips the /api/admin prefix, routes are /users/...
app.use(adminUsersRouter)

export default app
