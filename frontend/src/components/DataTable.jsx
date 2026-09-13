export function DataTable({ columns, rows, keyField = 'id', emptyMessage = 'No data yet.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
