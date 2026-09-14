import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { resetPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <h2 style={{ marginBottom: 10 }}>Password updated</h2>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>You can now sign in with your new password.</p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Back to Sign In
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 style={{ marginBottom: 6 }}>Reset your password</h2>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>Paste your reset token and choose a new password.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Reset Token</label>
          <input className="input" value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">New Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">Confirm New Password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
