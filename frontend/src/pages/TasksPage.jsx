import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listAllTasks } from '../api/tasks'
import { TaskTable } from '../components/TaskTable'
import { useAuth } from '../auth/AuthContext'

const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'mine', label: 'My Tasks' },
  { key: 'by_requirement', label: 'By Requirement' },
]

export function TasksPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('assignee') === 'me' ? 'mine' : 'all')

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => listAllTasks() })

  const visibleTasks = useMemo(() => {
    if (tab === 'mine') return tasks.filter((t) => t.assignee?.id === user.id)
    return tasks
  }, [tasks, tab, user.id])

  const grouped = useMemo(() => {
    const map = {}
    for (const t of visibleTasks) {
      const key = t.requirement_title || 'Unlinked'
      map[key] = map[key] || []
      map[key].push(t)
    }
    return map
  }, [visibleTasks])

  return (
    <div>
      <div className="page-title">Tasks</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>Track work across every project you're on.</div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : tab === 'by_requirement' ? (
        Object.entries(grouped).map(([reqTitle, groupTasks]) => (
          <div key={reqTitle} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{reqTitle}</div>
            <TaskTable tasks={groupTasks} queryKeyToInvalidate={['tasks']} />
          </div>
        ))
      ) : (
        <TaskTable
          tasks={visibleTasks}
          queryKeyToInvalidate={['tasks']}
          emptyMessage={tab === 'mine' ? "You don't have any tasks assigned yet." : 'No tasks yet.'}
        />
      )}
    </div>
  )
}
