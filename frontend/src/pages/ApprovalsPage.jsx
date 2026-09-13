import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listProjects } from '../api/projects'
import { listPendingRequirements, approveRequirement, rejectRequirement } from '../api/requirements'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'

export function ApprovalsPage() {
  const queryClient = useQueryClient()
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: listProjects })

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-requirements', projects.map((p) => p.id)],
    queryFn: async () => {
      const lists = await Promise.all(
        projects.map(async (p) => (await listPendingRequirements(p.id)).map((r) => ({ ...r, project_name: p.name })))
      )
      return lists.flat()
    },
    enabled: projects.length > 0,
  })

  const [selected, setSelected] = useState(new Set())

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-requirements'] })
    setSelected(new Set())
  }
  const approveMutation = useMutation({ mutationFn: (id) => approveRequirement(id), onSuccess: invalidate })
  const rejectMutation = useMutation({ mutationFn: (id) => rejectRequirement(id), onSuccess: invalidate })

  function approveSelected() {
    selected.forEach((id) => approveMutation.mutate(id))
  }

  const columns = [
    {
      key: 'select',
      header: '',
      render: (r) => <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />,
    },
    { key: 'title', header: 'Requirement Title' },
    { key: 'project_name', header: 'Project' },
    { key: 'created_by', header: 'Submitted By', render: (r) => r.created_by?.name },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'created_at', header: 'Submitted On', render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => rejectMutation.mutate(r.id)}>
          Reject
        </button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">Pending Approvals</div>
          <div className="page-subtitle">Review and approve requirements across your projects.</div>
        </div>
        <button className="btn btn-primary" disabled={selected.size === 0} onClick={approveSelected}>
          Approve Selected ({selected.size})
        </button>
      </div>
      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={pending} emptyMessage="Nothing pending approval." />}
    </div>
  )
}
