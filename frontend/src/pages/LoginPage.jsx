import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../auth/AuthContext'
import { apiErrorMessage } from '../api/client'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Sign in to manage your projects and drive impact.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
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
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        {error && (
          <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        New to ProjectSync?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  )
}
