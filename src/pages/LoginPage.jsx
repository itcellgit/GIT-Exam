import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in — skip the form.
  if (user) return <Navigate to="/admin" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2 className="auth-title">Admin Login</h2>
        <p className="auth-sub">Sign in to publish notifications.</p>

        {error && <div className="form-error">{error}</div>}

        <label className="field-label" htmlFor="username">Username</label>
        <input
          id="username"
          className="field-input"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="field-label" htmlFor="password">Password</label>
        <input
          id="password"
          className="field-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <Link className="auth-link" to="/forgot">Forgot password?</Link>
      </form>
    </div>
  )
}
