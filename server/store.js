// Simple JSON-file backed store for notifications and the admin user.
// On first run it seeds notifications from src/data/notifications.js and
// creates a default admin account.
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import {
  getNotificationDateTime,
  getNotificationCreatedAtTime,
  sortNotifications,
  getNotificationYear,
  getYearlyFileName,
  getYearlyFilePath,
  readYearlyNotifications,
  writeYearlyNotifications,
  listArchiveYears,
} from './notificationArchive.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const NOTIFICATIONS_FILE = join(DATA_DIR, 'notifications.json')
const USERS_FILE = join(DATA_DIR, 'users.json')
const RESET_TOKENS_FILE = join(DATA_DIR, 'reset-tokens.json')
export const UPLOADS_DIR = join(__dirname, 'uploads')

// Default admin credentials used only when no users file exists yet.
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

async function hasYearlyArchives() {
  const entries = await fs.readdir(DATA_DIR).catch(() => [])
  return entries.some((name) => /^notifications_\d{4}\.json$/.test(name))
}

async function migrateLegacyNotifications() {
  try {
    const legacy = await readJson(NOTIFICATIONS_FILE, [])
    if (!Array.isArray(legacy) || legacy.length === 0) return false

    if (await hasYearlyArchives()) return false

    await writeYearlyNotifications(DATA_DIR, legacy, { overwrite: false })
    await fs.rm(NOTIFICATIONS_FILE, { force: true })
    console.log(`Migrated ${legacy.length} notifications from ${NOTIFICATIONS_FILE} to yearly archive files.`)
    return true
  } catch (err) {
    console.warn('Legacy notification migration skipped:', err.message)
    return false
  }
}

async function seedNotifications() {
  // Pull the existing static notifications so viewers keep seeing them.
  const seedPath = join(__dirname, '..', 'src', 'data', 'notifications.js')
  let seed = []
  try {
    const mod = await import(pathToFileURL(seedPath).href)
    seed = Array.isArray(mod.default) ? mod.default : []
  } catch (err) {
    console.warn('Could not seed notifications from src/data/notifications.js:', err.message)
  }
  const withIds = seed.map((n) => ({
    id: randomUUID(),
    date: n.date,
    text: n.text,
    pdf: n.pdf || null,
    createdAt: new Date().toISOString(),
  }))
  await writeYearlyNotifications(DATA_DIR, withIds, { overwrite: false })
  console.log(`Seeded ${withIds.length} notifications into yearly archive files in ${DATA_DIR}`)
  return withIds
}

export async function initStore() {
  await ensureDirs()

  if (await hasYearlyArchives()) {
    return
  }

  try {
    await fs.access(NOTIFICATIONS_FILE)
    await migrateLegacyNotifications()
  } catch {
    await seedNotifications()
  }

  // Create a default admin if no users file exists.
  try {
    await fs.access(USERS_FILE)
  } catch {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)
    await writeJson(USERS_FILE, [
      { username: DEFAULT_ADMIN_USERNAME, email: DEFAULT_ADMIN_EMAIL, passwordHash },
    ])
    console.log('────────────────────────────────────────────────────────')
    console.log(' Created default admin account:')
    console.log(`   username: ${DEFAULT_ADMIN_USERNAME}`)
    console.log(`   password: ${DEFAULT_ADMIN_PASSWORD}`)
    console.log(`   email:    ${DEFAULT_ADMIN_EMAIL || '(not set — set ADMIN_EMAIL for password reset)'}`)
    console.log(' Change it by setting ADMIN_USERNAME / ADMIN_PASSWORD /')
    console.log(' ADMIN_EMAIL env vars and deleting server/data/users.json,')
    console.log(' or update that file directly.')
    console.log('────────────────────────────────────────────────────────')
  }
}

// ── Notifications ──
export async function getNotifications() {
  return readYearlyNotifications(DATA_DIR, [])
}

// Cheap: only reads yearly archive file names, not their contents.
export async function getNotificationYears() {
  return listArchiveYears(DATA_DIR)
}

// Server-side filter + paginate. When `year` is given, only that year's
// archive file is read from disk instead of every year in history — the
// fast path that keeps this cheap as the notification history grows.
export async function queryNotifications({ year, month, day, q, page, pageSize }) {
  let list
  if (year) {
    const filePath = getYearlyFilePath(DATA_DIR, year)
    const raw = await fs.readFile(filePath, 'utf8').catch(() => '[]')
    try {
      const parsed = JSON.parse(raw)
      list = sortNotifications(Array.isArray(parsed) ? parsed : [])
    } catch {
      list = []
    }
  } else {
    list = await getNotifications()
  }

  const needle = q ? q.toLowerCase() : ''
  const filtered = list.filter((n) => {
    const [dd, mm, yyyy] = String(n.date || '').split('.')
    if (year && yyyy !== String(year)) return false
    if (month && mm !== month) return false
    if (day && dd !== day) return false
    if (needle && !n.text.toLowerCase().includes(needle)) return false
    return true
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return { items, total, page: safePage, pageSize, totalPages }
}

export async function addNotification({ date, text, pdf }) {
  const list = await getNotifications()
  const item = {
    id: randomUUID(),
    date,
    text,
    pdf: pdf || null,
    createdAt: new Date().toISOString(),
  }
  list.push(item)
  await writeYearlyNotifications(DATA_DIR, list)
  return item
}

export async function updateNotification(id, fields) {
  const list = await getNotifications()
  const idx = list.findIndex((n) => n.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...fields, updatedAt: new Date().toISOString() }
  await writeYearlyNotifications(DATA_DIR, list)
  return list[idx]
}

export async function deleteNotification(id) {
  const list = await getNotifications()
  const item = list.find((n) => n.id === id)
  const next = list.filter((n) => n.id !== id)
  await writeYearlyNotifications(DATA_DIR, next)
  return item || null
}

// ── Users ──
export async function findUser(username) {
  const users = await readJson(USERS_FILE, [])
  return users.find((u) => u.username === username) || null
}

export async function findUserByEmail(email) {
  if (!email) return null
  const users = await readJson(USERS_FILE, [])
  const target = email.trim().toLowerCase()
  return users.find((u) => u.email && u.email.toLowerCase() === target) || null
}

export async function verifyUser(username, password) {
  const user = await findUser(username)
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  return ok ? { username: user.username } : null
}

export async function setPasswordByUsername(username, newPassword) {
  const users = await readJson(USERS_FILE, [])
  const idx = users.findIndex((u) => u.username === username)
  if (idx === -1) return false
  users[idx].passwordHash = await bcrypt.hash(newPassword, 10)
  await writeJson(USERS_FILE, users)
  return true
}

// ── Password-reset tokens (single-use, hashed at rest, time-limited) ──
export async function addResetToken({ username, tokenHash, expiresAt }) {
  const now = Date.now()
  const list = (await readJson(RESET_TOKENS_FILE, [])).filter((t) => t.expiresAt > now)
  // One active token per user: drop any previous ones.
  const others = list.filter((t) => t.username !== username)
  others.push({ username, tokenHash, expiresAt })
  await writeJson(RESET_TOKENS_FILE, others)
}

// Returns the matching record (and removes it) if valid and unexpired.
export async function consumeResetToken(tokenHash) {
  const now = Date.now()
  const list = await readJson(RESET_TOKENS_FILE, [])
  const match = list.find((t) => t.tokenHash === tokenHash && t.expiresAt > now)
  const remaining = list.filter((t) => t.tokenHash !== tokenHash && t.expiresAt > now)
  await writeJson(RESET_TOKENS_FILE, remaining)
  return match || null
}
