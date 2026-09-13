import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/tasks?assignee=me', label: 'My Tasks', icon: '✅', match: '/tasks' },
  { to: '/approvals', label: 'Approvals', icon: '📝', roles: ['admin', 'pm'] },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          background: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 12px 24px', fontSize: 19, fontWeight: 700, color: '#fff' }}>
          Project<span style={{ color: '#6fa0ff' }}>Sync</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              style={({ isActive }) => {
                const active = isActive || (item.match && window.location.pathname.startsWith(item.match))
                return {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  background: active ? 'var(--accent)' : 'transparent',
                }
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: 64,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <input
            className="input"
            placeholder="Search projects, requirements, tasks..."
            style={{ maxWidth: 360 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={user?.name} />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
