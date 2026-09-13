import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listProjects } from '../api/projects'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'

export function ReportsPage() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects })

  const totalRequirements = projects.reduce((sum, p) => sum + p.requirement_count, 0)
  const avgProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress_pct, 0) / projects.length) : 0

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <Link to={`/projects/${p.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
          {p.name}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'requirement_count', header: 'Requirements' },
    { key: 'progress_pct', header: 'Progress', render: (p) => `${p.progress_pct}%` },
  ]

  return (
    <div>
      <div className="page-title">Reports</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>A cross-project snapshot of delivery health.</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Total Requirements" value={totalRequirements} />
        <StatCard label="Average Progress" value={`${avgProgress}%`} />
      </div>

      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={projects} />}
    </div>
  )
}
