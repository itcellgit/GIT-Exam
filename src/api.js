// Thin fetch wrapper around the backend API.
const TOKEN_KEY = 'git_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function handle(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export async function apiLogin(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handle(res)
}

export async function apiMe() {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return handle(res)
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  return handle(res)
}

export async function requestPasswordReset(email) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handle(res)
}

export async function resetPassword(token, newPassword) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  })
  return handle(res)
}

export async function fetchNotifications() {
  const res = await fetch('/api/notifications')
  return handle(res)
}

// payload: { text, date?, pdfUrl?, pdfFile? (File) }
export async function publishNotification({ text, date, pdfUrl, pdfFile }) {
  const form = new FormData()
  form.append('text', text)
  if (date) form.append('date', date)
  if (pdfUrl) form.append('pdfUrl', pdfUrl)
  if (pdfFile) form.append('pdfFile', pdfFile)
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  return handle(res)
}

// payload: { text, date?, pdfUrl?, pdfFile? (File), removePdf? (bool) }
export async function updateNotification(id, { text, date, pdfUrl, pdfFile, removePdf }) {
  const form = new FormData()
  if (text !== undefined) form.append('text', text)
  if (date) form.append('date', date)
  if (pdfUrl) form.append('pdfUrl', pdfUrl)
  if (pdfFile) form.append('pdfFile', pdfFile)
  if (removePdf) form.append('removePdf', 'true')
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  return handle(res)
}

export async function deleteNotification(id) {
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return handle(res)
}
