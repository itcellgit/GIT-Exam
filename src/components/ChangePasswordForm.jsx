import { useState } from 'react'
import { changePassword } from '../api'

export default function ChangePasswordForm({ onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (next.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="admin-form admin-form--modal">
        <div className="form-success">Your password has been changed successfully.</div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <form className="admin-form admin-form--modal" onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}

      <label className="field-label" htmlFor="cp-current">Current password</label>
      <input
        id="cp-current"
        className="field-input"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
      />

      <label className="field-label" htmlFor="cp-new">New password</label>
      <input
        id="cp-new"
        className="field-input"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
      />
      <span className="field-hint">At least 6 characters.</span>

      <label className="field-label" htmlFor="cp-confirm">Confirm new password</label>
      <input
        id="cp-confirm"
        className="field-input"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}
