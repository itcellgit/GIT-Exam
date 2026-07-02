import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (next.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (next !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(token, next)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {!token ? (
          <div className="form-error">
            Missing reset token. Please use the link from your email, or request a new one.
          </div>
        ) : done ? (
          <>
            <div className="form-success">
              Your password has been reset. You can now sign in with your new password.
            </div>
            <Link className="btn-primary" to="/login" style={{ textAlign: 'center' }}>
              Go to Login
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {error && <div className="form-error">{error}</div>}
            <label className="field-label" htmlFor="rp-new">New password</label>
            <input
              id="rp-new"
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <span className="field-hint">At least 6 characters.</span>
            <label className="field-label" htmlFor="rp-confirm">Confirm new password</label>
            <input
              id="rp-confirm"
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button className="btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'stretch' }}>
              {busy ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
