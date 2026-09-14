import { useAuth } from './AuthContext'

export function useHasPageAccess(page, write = false) {
  const { user } = useAuth()
  if (!user) return false
  if (user.role === 'admin') return true
  const perm = user.permissions?.[page]
  return write ? !!perm?.can_write : !!perm?.can_read
}
