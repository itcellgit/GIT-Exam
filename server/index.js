import './env.js' // must be first: loads .env before other modules read process.env
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import compression from 'compression'

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
  getNotificationYears,
  queryNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
  UPLOADS_DIR,
} from './store.js'
import {
  initSidebarLinksStore,
  getSidebarLinks,
  addSidebarLink,
  updateSidebarLink,
  deleteSidebarLink,
  reorderSidebarLinks,
} from './sidebarLinksStore.js'

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

// Sidebar link attachments: PDFs and common image formats.
const LINK_FILE_EXTS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif'])
const uploadLinkFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/') ||
      LINK_FILE_EXTS.has(extname(file.originalname).toLowerCase())
    cb(isAllowed ? null : new Error('Only PDF or image files are allowed'), isAllowed)
  },
})

const app = express()
app.use(compression())
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
// Query params: year, month (mm), day (dd), q (free-text), page, pageSize.
// All optional; omitting them returns page 1 of the full (sorted) history.
app.get('/api/notifications', async (req, res) => {
  const { year, month, day, q } = req.query
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20))

  const [result, years] = await Promise.all([
    queryNotifications({ year, month, day, q, page, pageSize }),
    getNotificationYears(),
  ])

  res.set('Cache-Control', 'public, max-age=30')
  res.json({ ...result, years })
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

// ── Sidebar links (Transcript Application / Help Files) ──
app.get('/api/sidebar-links', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=30')
  res.json(await getSidebarLinks())
})

app.post('/api/sidebar-links/:section', requireAuth, uploadLinkFile.single('file'), async (req, res) => {
  const { text, note } = req.body
  let { url } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Link text is required' })
  }
  if (req.file) url = `/uploads/${req.file.filename}`
  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'A file upload or URL is required' })
  }
  try {
    const item = await addSidebarLink(req.params.section, {
      text: text.trim(),
      url: url.trim(),
      note: note && note.trim() ? note.trim() : null,
    })
    res.status(201).json(item)
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

// Must be registered before the generic ':id' route below.
app.put('/api/sidebar-links/:section/reorder', requireAuth, async (req, res) => {
  const { order } = req.body || {}
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of ids' })
  }
  try {
    const list = await reorderSidebarLinks(req.params.section, order)
    res.json(list)
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.put('/api/sidebar-links/:section/:id', requireAuth, uploadLinkFile.single('file'), async (req, res) => {
  const { text, note } = req.body
  let { url } = req.body
  const fields = {}

  if (text !== undefined) {
    if (!text.trim()) return res.status(400).json({ error: 'Link text is required' })
    fields.text = text.trim()
  }
  if (req.file) fields.url = `/uploads/${req.file.filename}`
  else if (url && url.trim()) fields.url = url.trim()
  if (note !== undefined) fields.note = note.trim() ? note.trim() : null

  try {
    const updated = await updateSidebarLink(req.params.section, req.params.id, fields)
    if (!updated) return res.status(404).json({ error: 'Link not found' })
    res.json(updated)
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.delete('/api/sidebar-links/:section/:id', requireAuth, async (req, res) => {
  try {
    const removed = await deleteSidebarLink(req.params.section, req.params.id)
    if (!removed) return res.status(404).json({ error: 'Link not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

// Multer / generic error handler
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Request failed' })
  next()
})

// ── Serve built frontend in production (single-server deployment) ──
const distDir = join(__dirname, '..', 'dist')
if (existsSync(distDir)) {
  // Vite content-hashes every JS/CSS filename, so those files are safe to
  // cache forever — but index.html must always be revalidated. Otherwise a
  // stale cached index.html can point at a hashed asset that a later
  // deploy has since deleted, and a reload 404s on it (white screen).
  app.use(express.static(distDir, { index: false, maxAge: '1y', immutable: true }))
  // SPA fallback (Express 5: avoid the bare '*' string route).
  app.use((req, res) => {
    res.set('Cache-Control', 'no-store')
    res.sendFile(join(distDir, 'index.html'))
  })
}

Promise.all([initStore(), initSidebarLinksStore()])
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to initialise store:', err)
    process.exit(1)
  })
