import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from './DataTable'
import { StatusBadge } from './StatusBadge'
import { Avatar } from './Avatar'
import { useAuth } from '../auth/AuthContext'
import { useHasPageAccess } from '../auth/useHasPageAccess'
import { updateTaskStatus } from '../api/tasks'

const STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done']

export function TaskTable({ tasks, queryKeyToInvalidate, emptyMessage }) {
  const { user } = useAuth()
  const canWriteTasks = useHasPageAccess('tasks', true)
  const queryClient = useQueryClient()
  const [savingId, setSavingId] = useState(null)

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateTaskStatus(id, status),
    onMutate: ({ id }) => setSavingId(id),
    onSettled: () => {
      setSavingId(null)
      if (queryKeyToInvalidate) queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate })
    },
  })

  function canEdit(task) {
    if (task.assignee?.id === user.id) return true
    return canWriteTasks
  }

  const columns = [
    { key: 'title', header: 'Task Title' },
    { key: 'requirement_title', header: 'Requirement', render: (t) => t.requirement_title || '—' },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (t) =>
        t.assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={t.assignee.name} size={22} />
            {t.assignee.name}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) =>
        canEdit(t) ? (
          <select
            className="input"
            style={{ padding: '4px 8px', fontSize: 13, width: 140 }}
            value={t.status}
            disabled={savingId === t.id}
            onChange={(e) => mutation.mutate({ id: t.id, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge status={t.status} />
        ),
    },
    { key: 'due_date', header: 'Due Date', render: (t) => t.due_date || '—' },
  ]

  return <DataTable columns={columns} rows={tasks} emptyMessage={emptyMessage || 'No tasks yet.'} />
}
