import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return null
  return children
}
