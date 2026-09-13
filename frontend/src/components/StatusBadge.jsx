const STATUS_STYLES = {
  // requirement / project statuses
  draft: 'gray',
  pending_approval: 'amber',
  approved: 'green',
  rejected: 'red',
  active: 'blue',
  on_hold: 'amber',
  completed: 'green',
  archived: 'gray',
  // task statuses
  todo: 'gray',
  in_progress: 'blue',
  blocked: 'red',
  done: 'green',
  // milestone statuses
  not_started: 'gray',
  on_track: 'green',
  at_risk: 'amber',
  late: 'red',
  // delivery statuses
  pending: 'amber',
  delivered: 'blue',
  accepted: 'green',
  // priority
  low: 'gray',
  medium: 'blue',
  high: 'red',
}

const LABELS = {
  pending_approval: 'Pending Approval',
  on_hold: 'On Hold',
  in_progress: 'In Progress',
  not_started: 'Not Started',
  on_track: 'On Track',
  at_risk: 'At Risk',
}

function label(status) {
  if (LABELS[status]) return LABELS[status]
  return status
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function StatusBadge({ status }) {
  const color = STATUS_STYLES[status] || 'gray'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: `var(--status-${color}-bg)`,
        color: `var(--status-${color}-text)`,
        whiteSpace: 'nowrap',
      }}
    >
      {label(status)}
    </span>
  )
}
