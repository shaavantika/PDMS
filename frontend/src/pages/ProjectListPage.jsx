import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listProjects, createProject } from '../api/projects'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'
import { useHasPageAccess } from '../auth/useHasPageAccess'
import { apiErrorMessage } from '../api/client'

export function ProjectListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects })
  const canWrite = useHasPageAccess('projects', true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', client_name: '', description: '' })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowCreate(false)
      setForm({ name: '', client_name: '', description: '' })
      navigate(`/projects/${project.id}`)
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const columns = [
    {
      key: 'name',
      header: 'Project Name',
      render: (p) => (
        <a onClick={() => navigate(`/projects/${p.id}`)} style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>
          {p.name}
        </a>
      ),
    },
    { key: 'client_name', header: 'Client', render: (p) => p.client_name || '—' },
    {
      key: 'owner',
      header: 'Owner',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={p.owner?.name} size={22} />
          {p.owner?.name}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'requirement_count', header: 'Requirements' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">Every project you own or are part of.</div>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        )}
      </div>

      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={projects} emptyMessage="No projects yet." />}

      {showCreate && (
        <Modal title="Create New Project" onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              createMutation.mutate(form)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Project Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Client</label>
              <input
                className="input"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Client or stakeholder org"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What are we doing on this project?"
              />
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
