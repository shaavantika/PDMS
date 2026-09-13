export function StatCard({ label, value, color = '#2f6fed' }) {
  return (
    <div className="card" style={{ padding: '18px 20px', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
