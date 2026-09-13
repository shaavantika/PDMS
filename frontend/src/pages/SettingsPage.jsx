import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>Your account details.</div>

      <div className="card" style={{ padding: 24, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name={user?.name} size={48} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'capitalize', marginTop: 4 }}>{user?.role}</div>
        </div>
      </div>
    </div>
  )
}
