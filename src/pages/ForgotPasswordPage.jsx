import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>
        {sent ? (
          <>
            <div className="form-success">
              If that email is registered, a password reset link has been sent. Please check your
              inbox (and spam folder). The link is valid for 1 hour.
            </div>
            <Link className="btn-primary" to="/login" style={{ textAlign: 'center' }}>
              Back to Login
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="auth-sub">
              Enter your registered admin email and we'll send you a reset link.
            </p>
            {error && <div className="form-error">{error}</div>}
            <label className="field-label" htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              className="field-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'stretch' }}>
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <Link className="auth-link" to="/login">Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  )
}
