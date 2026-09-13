import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listProjects } from '../api/projects'
import { listPendingRequirements } from '../api/requirements'
import { useAuth } from '../auth/AuthContext'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { Avatar } from '../components/Avatar'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects })

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-approvals-count', projects.map((p) => p.id)],
    queryFn: async () => {
      const lists = await Promise.all(projects.map((p) => listPendingRequirements(p.id)))
      return lists.reduce((sum, l) => sum + l.length, 0)
    },
    enabled: projects.length > 0,
  })

  const total = projects.length
  const active = projects.filter((p) => p.status === 'active').length
  const completed = projects.filter((p) => p.status === 'completed').length

  const columns = [
    {
      key: 'name',
      header: 'Project Name',
      render: (p) => (
        <Link to={`/projects/${p.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
          {p.name}
        </Link>
      ),
    },
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
    {
      key: 'progress_pct',
      header: 'Progress',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4 }}>
            <div
              style={{
                width: `${p.progress_pct}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 4,
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.progress_pct}%</span>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">Good day, {user?.name}!</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>Let's keep the momentum going.</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Projects" value={total} />
        <StatCard label="Active Projects" value={active} color="#1c8a4e" />
        <StatCard label="Pending Approvals" value={pendingCount} color="#b9770e" />
        <StatCard label="Completed Projects" value={completed} color="#1c8a4e" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>My Projects</div>
        <Link to="/projects" style={{ fontSize: 13, color: 'var(--accent)' }}>
          View All
        </Link>
      </div>
      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={projects} emptyMessage="No projects yet — create one to get started." />}
    </div>
  )
}
