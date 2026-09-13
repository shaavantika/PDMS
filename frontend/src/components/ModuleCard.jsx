import { Link } from 'react-router-dom'

export function ModuleCard({ module, projectId }) {
  return (
    <Link
      to={`/projects/${projectId}/modules/${module.id}`}
      className="card"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        color: 'inherit',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{module.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{module.description}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          {module.requirement_count} Requirement{module.requirement_count === 1 ? '' : 's'}
        </div>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>&rsaquo;</span>
    </Link>
  )
}
