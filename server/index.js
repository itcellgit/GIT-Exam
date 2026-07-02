import './env.js' // must be first: loads .env before other modules read process.env
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'

import {
  requireAuth,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth.js'
import {
  initStore,
  getNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
  UPLOADS_DIR,
} from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000

// ── Upload handling (PDF only, stored on disk) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' || extname(file.originalname).toLowerCase() === '.pdf'
    cb(isPdf ? null : new Error('Only PDF files are allowed'), isPdf)
  },
})

const app = express()
app.use(cors())
app.use(express.json())

// Serve uploaded PDFs
app.use('/uploads', express.static(UPLOADS_DIR))

// ── Auth ──
app.post('/api/auth/login', login)
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: { username: req.user.username } }))
app.post('/api/auth/change-password', requireAuth, changePassword)
app.post('/api/auth/forgot-password', forgotPassword)
app.post('/api/auth/reset-password', resetPassword)

// ── Notifications ──
app.get('/api/notifications', async (req, res) => {
  res.json(await getNotifications())
})

app.post('/api/notifications', requireAuth, upload.single('pdfFile'), async (req, res) => {
  const { text } = req.body
  let { date, pdfUrl } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Notification text is required' })
  }
  // Default date = today in dd.mm.yyyy to match existing format.
  if (!date) {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
  }
  // Prefer an uploaded file; fall back to an external URL if provided.
  let pdf = null
  if (req.file) pdf = `/uploads/${req.file.filename}`
  else if (pdfUrl && pdfUrl.trim()) pdf = pdfUrl.trim()

  const item = await addNotification({ date: date.trim(), text: text.trim(), pdf })
  res.status(201).json(item)
})

app.put('/api/notifications/:id', requireAuth, upload.single('pdfFile'), async (req, res) => {
  const list = await getNotifications()
  const existing = list.find((n) => n.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Notification not found' })

  const { text, date, pdfUrl, removePdf } = req.body
  const fields = {}

  if (text !== undefined) {
    if (!text.trim()) return res.status(400).json({ error: 'Notification text is required' })
    fields.text = text.trim()
  }
  if (date && date.trim()) fields.date = date.trim()

  // PDF precedence: new upload > explicit removal > new URL > keep existing.
  if (req.file) fields.pdf = `/uploads/${req.file.filename}`
  else if (removePdf === 'true') fields.pdf = null
  else if (pdfUrl && pdfUrl.trim()) fields.pdf = pdfUrl.trim()

  const updated = await updateNotification(req.params.id, fields)
  res.json(updated)
})

app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
  const removed = await deleteNotification(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Notification not found' })
  res.json({ ok: true })
})

// Multer / generic error handler
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Request failed' })
  next()
})

// ── Serve built frontend in production (single-server deployment) ──
const distDir = join(__dirname, '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback (Express 5: avoid the bare '*' string route).
  app.use((req, res) => res.sendFile(join(distDir, 'index.html')))
}

initStore()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to initialise store:', err)
    process.exit(1)
  })
