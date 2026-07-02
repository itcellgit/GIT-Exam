import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import {
  verifyUser,
  findUserByEmail,
  setPasswordByUsername,
  addResetToken,
  consumeResetToken,
} from './store.js'
import { sendResetEmail } from './mailer.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-secret'
const TOKEN_TTL = '8h'
const RESET_TTL_MS = 60 * 60 * 1000 // 1 hour
const MIN_PASSWORD = 6
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173'

export function signToken(user) {
  return jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

// Express middleware: requires a valid Bearer token.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export async function login(req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }
  const user = await verifyUser(username, password)
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })
  res.json({ token: signToken(user), user })
}

// Authenticated: change own password.
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' })
  }
  if (newPassword.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD} characters` })
  }
  const ok = await verifyUser(req.user.username, currentPassword)
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' })
  await setPasswordByUsername(req.user.username, newPassword)
  res.json({ ok: true })
}

// Public: request a reset link. Always returns success (no account enumeration).
export async function forgotPassword(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const user = await findUserByEmail(email)
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    await addResetToken({
      username: user.username,
      tokenHash: hashToken(rawToken),
      expiresAt: Date.now() + RESET_TTL_MS,
    })
    const resetUrl = `${APP_BASE_URL}/reset?token=${rawToken}`
    try {
      await sendResetEmail(user.email, resetUrl)
    } catch (err) {
      console.error('Failed to send reset email:', err.message)
    }
  }
  res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' })
}

// Public: complete the reset using the emailed token.
export async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  if (newPassword.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD} characters` })
  }
  const record = await consumeResetToken(hashToken(token))
  if (!record) return res.status(400).json({ error: 'This reset link is invalid or has expired' })
  await setPasswordByUsername(record.username, newPassword)
  res.json({ ok: true })
}
