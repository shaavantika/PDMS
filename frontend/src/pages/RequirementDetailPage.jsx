import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  getRequirement,
  updateRequirement,
  approveRequirement,
  rejectRequirement,
} from '../api/requirements'
import { listRequirementTasks, createRequirementTask } from '../api/tasks'
import { listUsers } from '../api/users'
import { StatusBadge } from '../components/StatusBadge'
import { TaskTable } from '../components/TaskTable'
import { Modal } from '../components/Modal'
import { RequireRole } from '../auth/ProtectedRoute'
import { apiErrorMessage } from '../api/client'

export function RequirementDetailPage() {
  const { id, moduleId, reqId } = useParams()
  const rId = Number(reqId)
  const queryClient = useQueryClient()

  const { data: requirement, isLoading } = useQuery({ queryKey: ['requirement', rId], queryFn: () => getRequirement(rId) })
  const { data: tasks = [] } = useQuery({ queryKey: ['requirement-tasks', rId], queryFn: () => listRequirementTasks(rId) })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: listUsers, retry: false })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['requirement', rId] })

  const submitMutation = useMutation({
    mutationFn: () => updateRequirement(rId, { status: 'pending_approval' }),
    onSuccess: invalidate,
  })
  const approveMutation = useMutation({ mutationFn: () => approveRequirement(rId), onSuccess: invalidate })
  const rejectMutation = useMutation({ mutationFn: () => rejectRequirement(rId), onSuccess: invalidate })

  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', assignee_id: '', due_date: '' })
  const [error, setError] = useState('')

  const addTaskMutation = useMutation({
    mutationFn: (data) => createRequirementTask(rId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-tasks', rId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowAddTask(false)
      setTaskForm({ title: '', assignee_id: '', due_date: '' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  if (isLoading || !requirement) return <div>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
        <Link to={`/projects/${id}`} style={{ color: 'var(--accent)' }}>Project</Link> &rsaquo;{' '}
        <Link to={`/projects/${id}/modules/${moduleId}`} style={{ color: 'var(--accent)' }}>Module</Link> &rsaquo; REQ-{requirement.id}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">{requirement.title}</div>
          <div className="page-subtitle">Created {new Date(requirement.created_at).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={requirement.status} />
          {requirement.status === 'draft' && (
            <button className="btn btn-secondary" onClick={() => submitMutation.mutate()}>
              Submit for Approval
            </button>
          )}
          {requirement.status === 'pending_approval' && (
            <RequireRole roles={['admin', 'pm']}>
              <button className="btn btn-danger" onClick={() => rejectMutation.mutate()}>
                Reject
              </button>
              <button className="btn btn-primary" onClick={() => approveMutation.mutate()}>
                Approve
              </button>
            </RequireRole>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Description</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {requirement.description || 'No description provided.'}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 10, fontSize: 13 }}>
            <div style={{ color: 'var(--text-secondary)' }}>Priority</div>
            <div><StatusBadge status={requirement.priority} /></div>
            <div style={{ color: 'var(--text-secondary)' }}>Created By</div>
            <div>{requirement.created_by?.name}</div>
            {requirement.approved_by && (
              <>
                <div style={{ color: 'var(--text-secondary)' }}>Approved By</div>
                <div>{requirement.approved_by?.name}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>Tasks</div>
        <RequireRole roles={['admin', 'pm']}>
          <button className="btn btn-secondary" onClick={() => setShowAddTask(true)}>
            + Add Task
          </button>
        </RequireRole>
      </div>
      <TaskTable tasks={tasks} queryKeyToInvalidate={['requirement-tasks', rId]} emptyMessage="No tasks linked to this requirement yet." />

      {showAddTask && (
        <Modal title="Add Task" onClose={() => setShowAddTask(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              addTaskMutation.mutate(taskForm)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Title *</label>
              <input className="input" required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Assignee</label>
              <select className="input" value={taskForm.assignee_id} onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Due Date</label>
              <input className="input" type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={addTaskMutation.isPending}>
                {addTaskMutation.isPending ? 'Saving...' : 'Add Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
