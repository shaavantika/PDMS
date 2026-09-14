import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getModule } from '../api/modules'
import { listRequirements, createRequirement } from '../api/requirements'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { useHasPageAccess } from '../auth/useHasPageAccess'
import { apiErrorMessage } from '../api/client'

export function ModuleDetailPage() {
  const { id, moduleId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mId = Number(moduleId)

  const { data: module } = useQuery({ queryKey: ['module', mId], queryFn: () => getModule(mId) })
  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements', mId],
    queryFn: () => listRequirements(mId),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' })
  const [error, setError] = useState('')
  const canWrite = useHasPageAccess('requirements', true)

  const createMutation = useMutation({
    mutationFn: (data) => createRequirement(mId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', mId] })
      setShowCreate(false)
      setForm({ title: '', description: '', priority: 'medium' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const columns = [
    {
      key: 'title',
      header: '#',
      render: (r) => `REQ-${r.id}`,
    },
    {
      key: 'name',
      header: 'Requirement Title',
      render: (r) => (
        <a
          onClick={() => navigate(`/projects/${id}/modules/${mId}/requirements/${r.id}`)}
          style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
        >
          {r.title}
        </a>
      ),
    },
    { key: 'created_by', header: 'Created By', render: (r) => r.created_by?.name },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'created_at', header: 'Created On', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ]

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
        <Link to={`/projects/${id}`} style={{ color: 'var(--accent)' }}>Project</Link> &rsaquo; {module?.name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">{module?.name}</div>
          <div className="page-subtitle">{module?.description}</div>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add Requirement
          </button>
        )}
      </div>

      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={requirements} emptyMessage="No requirements yet." />}

      {showCreate && (
        <Modal title="Add Requirement" onClose={() => setShowCreate(false)}>
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
              <label className="field-label">Description</label>
              <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Requirement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
