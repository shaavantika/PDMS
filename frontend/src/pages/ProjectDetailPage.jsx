import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getProject, addProjectMember } from '../api/projects'
import { listModules, createModule } from '../api/modules'
import { listAllTasks } from '../api/tasks'
import { listMilestones, createMilestone } from '../api/milestones'
import { listProjectDeliveries, createProjectDelivery, createMilestoneDelivery, updateDeliveryStatus } from '../api/deliveries'
import { listUsers } from '../api/users'
import { StatusBadge } from '../components/StatusBadge'
import { Avatar } from '../components/Avatar'
import { DataTable } from '../components/DataTable'
import { ModuleCard } from '../components/ModuleCard'
import { TaskTable } from '../components/TaskTable'
import { Modal } from '../components/Modal'
import { RequireRole } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/AuthContext'
import { apiErrorMessage } from '../api/client'

const TABS = ['Overview', 'Modules', 'Tasks', 'Milestones', 'Deliveries', 'Reports']

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const [tab, setTab] = useState('Overview')

  const { data: project, isLoading } = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId) })

  if (isLoading || !project) return <div>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="page-title">{project.name}</div>
          <div className="page-subtitle">{project.description}</div>
        </div>
        <StatusBadge status={project.status} />
      </div>

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

      {tab === 'Overview' && <OverviewTab project={project} />}
      {tab === 'Modules' && <ModulesTab projectId={projectId} />}
      {tab === 'Tasks' && <TasksTab projectId={projectId} />}
      {tab === 'Milestones' && <MilestonesTab projectId={projectId} />}
      {tab === 'Deliveries' && <DeliveriesTab projectId={projectId} />}
      {tab === 'Reports' && <ReportsTab projectId={projectId} project={project} />}
    </div>
  )
}

function OverviewTab({ project }) {
  const queryClient = useQueryClient()
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: listUsers, retry: false })
  const [selectedUserId, setSelectedUserId] = useState('')

  const addMemberMutation = useMutation({
    mutationFn: (userId) => addProjectMember(project.id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', project.id] }),
  })

  const memberIds = new Set((project.members || []).map((m) => m.id))
  const candidateUsers = users.filter((u) => u.role === 'member' && !memberIds.has(u.id))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 10, fontSize: 14 }}>
          <div style={{ color: 'var(--text-secondary)' }}>Client</div>
          <div>{project.client_name || '—'}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Owner</div>
          <div>{project.owner?.name}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Requirements</div>
          <div>{project.requirement_count}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Progress</div>
          <div>{project.progress_pct}%</div>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Team</div>
        {candidateUsers.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select className="input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Add a member...</option>
              {candidateUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              disabled={!selectedUserId}
              onClick={() => {
                addMemberMutation.mutate(Number(selectedUserId))
                setSelectedUserId('')
              }}
            >
              Add
            </button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(project.members || []).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No members added yet.</div>
          ) : (
            project.members.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Avatar name={m.name} size={22} />
                {m.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ModulesTab({ projectId }) {
  const queryClient = useQueryClient()
  const { data: modules = [], isLoading } = useQuery({ queryKey: ['modules', projectId], queryFn: () => listModules(projectId) })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => createModule(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', projectId] })
      setShowCreate(false)
      setForm({ name: '', description: '' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <RequireRole roles={['admin', 'pm']}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add Module
          </button>
        </RequireRole>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : modules.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No modules yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {modules.map((m) => (
            <ModuleCard key={m.id} module={m} projectId={projectId} />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add Module" onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              createMutation.mutate(form)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Module Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Module'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function TasksTab({ projectId }) {
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => listAllTasks() })
  const projectTasks = tasks.filter((t) => t.project_id === projectId)
  if (isLoading) return <div>Loading...</div>
  return <TaskTable tasks={projectTasks} queryKeyToInvalidate={['tasks']} emptyMessage="No tasks yet — add tasks from a requirement." />
}

function MilestonesTab({ projectId }) {
  const queryClient = useQueryClient()
  const { data: milestones = [], isLoading } = useQuery({ queryKey: ['milestones', projectId], queryFn: () => listMilestones(projectId) })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', due_date: '', description: '' })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => createMilestone(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      setShowCreate(false)
      setForm({ name: '', due_date: '', description: '' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const columns = [
    { key: 'name', header: 'Milestone' },
    { key: 'due_date', header: 'Due Date', render: (m) => m.due_date || '—' },
    { key: 'task_count', header: 'Tasks' },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <RequireRole roles={['admin', 'pm']}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add Milestone
          </button>
        </RequireRole>
      </div>
      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={milestones} emptyMessage="No milestones yet." />}

      {showCreate && (
        <Modal title="Add Milestone" onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              createMutation.mutate(form)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Milestone Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Milestone'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function DeliveriesTab({ projectId }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: deliveries = [], isLoading } = useQuery({ queryKey: ['deliveries', projectId], queryFn: () => listProjectDeliveries(projectId) })
  const { data: milestones = [] } = useQuery({ queryKey: ['milestones', projectId], queryFn: () => listMilestones(projectId) })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', artifact_url: '', milestone_id: '' })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) =>
      data.milestone_id
        ? createMilestoneDelivery(data.milestone_id, data)
        : createProjectDelivery(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', projectId] })
      setShowCreate(false)
      setForm({ title: '', artifact_url: '', milestone_id: '' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateDeliveryStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries', projectId] }),
  })

  const canWrite = user.role === 'admin' || user.role === 'pm'

  const NEXT_STATUS = { pending: 'delivered', delivered: 'accepted' }

  const columns = [
    { key: 'title', header: 'Delivery' },
    { key: 'artifact_url', header: 'Artifact', render: (d) => (d.artifact_url ? <a href={d.artifact_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Link</a> : '—') },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'closed_at', header: 'Closed', render: (d) => (d.closed_at ? new Date(d.closed_at).toLocaleDateString() : '—') },
    {
      key: 'actions',
      header: '',
      render: (d) =>
        canWrite && NEXT_STATUS[d.status] ? (
          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => statusMutation.mutate({ id: d.id, status: NEXT_STATUS[d.status] })}>
            Mark {NEXT_STATUS[d.status]}
          </button>
        ) : null,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <RequireRole roles={['admin', 'pm']}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add Delivery
          </button>
        </RequireRole>
      </div>
      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={deliveries} emptyMessage="No deliveries yet." />}

      {showCreate && (
        <Modal title="Add Delivery" onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              createMutation.mutate(form)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Title *</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Artifact URL</label>
              <input className="input" value={form.artifact_url} onChange={(e) => setForm({ ...form, artifact_url: e.target.value })} placeholder="https://..." />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Milestone (optional)</label>
              <select className="input" value={form.milestone_id} onChange={(e) => setForm({ ...form, milestone_id: e.target.value })}>
                <option value="">None — project-level delivery</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Delivery'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function ReportsTab({ projectId }) {
  const { data: modules = [] } = useQuery({ queryKey: ['modules', projectId], queryFn: () => listModules(projectId) })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => listAllTasks() })
  const { data: milestones = [] } = useQuery({ queryKey: ['milestones', projectId], queryFn: () => listMilestones(projectId) })
  const { data: deliveries = [] } = useQuery({ queryKey: ['deliveries', projectId], queryFn: () => listProjectDeliveries(projectId) })

  const projectTasks = tasks.filter((t) => t.project_id === projectId)
  const tasksByStatus = ['todo', 'in_progress', 'blocked', 'done'].map((s) => ({
    status: s,
    count: projectTasks.filter((t) => t.status === s).length,
  }))
  const milestonesByStatus = ['not_started', 'on_track', 'at_risk', 'late', 'completed'].map((s) => ({
    status: s,
    count: milestones.filter((m) => m.status === s).length,
  }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Tasks by Status</div>
        {tasksByStatus.map((row) => (
          <div key={row.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <StatusBadge status={row.status} />
            <span>{row.count}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Milestone Health</div>
        {milestonesByStatus.map((row) => (
          <div key={row.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <StatusBadge status={row.status} />
            <span>{row.count}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Summary</div>
        <div style={{ fontSize: 14, lineHeight: 2 }}>
          <div>Modules: {modules.length}</div>
          <div>Tasks: {projectTasks.length}</div>
          <div>Milestones: {milestones.length}</div>
          <div>Deliveries: {deliveries.length}</div>
          <div>Accepted Deliveries: {deliveries.filter((d) => d.status === 'accepted').length}</div>
        </div>
      </div>
    </div>
  )
}
