import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { register } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      setSubmitted(true)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout>
        <h2 style={{ marginBottom: 10 }}>Account created</h2>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>
          An admin will review and approve your account before you can sign in. You'll be able to log in once
          approved.
        </p>
        <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          Back to Sign In
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 style={{ marginBottom: 6 }}>Create your account</h2>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Sign up to get started. An admin will approve your account before you can sign in.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@company.com"
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </div>
        {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
