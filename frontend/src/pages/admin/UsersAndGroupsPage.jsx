import { useState } from 'react'
import { UserManagementPage } from './UserManagementPage'
import { GroupManagementPage } from './GroupManagementPage'

const TABS = ['Users', 'Groups']

export function UsersAndGroupsPage() {
  const [tab, setTab] = useState('Users')

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Users' && <UserManagementPage />}
      {tab === 'Groups' && <GroupManagementPage />}
    </div>
  )
}
