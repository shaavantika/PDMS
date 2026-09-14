import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { forgotPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { reset_token } = await forgotPassword(email)
      setResetToken(reset_token)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (resetToken) {
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`
    return (
      <AuthLayout>
        <h2 style={{ marginBottom: 10 }}>Reset link generated</h2>
        <p className="page-subtitle" style={{ marginBottom: 16 }}>
          This app doesn't send emails yet, so here is your reset link directly. It expires in 30 minutes and works
          once.
        </p>
        <div
          className="card"
          style={{ padding: 12, fontSize: 13, wordBreak: 'break-all', marginBottom: 20, background: 'var(--surface-alt)' }}
        >
          {resetLink}
        </div>
        <Link to={`/reset-password?token=${resetToken}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Continue to Reset Password
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 style={{ marginBottom: 6 }}>Forgot your password?</h2>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Enter your account email and we'll generate a reset link.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />
        </div>
        {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Generating link...' : 'Get Reset Link'}
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
