export function AuthLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(160deg, #0b1e3d 0%, #14264a 60%, #1c3568 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 64px',
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700 }}>
          Project<span style={{ color: '#6fa0ff' }}>Sync</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 15, color: '#b9c6dd' }}>From ideas to impact</div>
        <div style={{ marginTop: 48, fontSize: 15, color: '#dfe6f2', lineHeight: 1.7 }}>
          Plan &middot; Execute &middot; Deliver
          <br />
          Track every requirement from intake to sign-off, in one place.
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 360 }}>{children}</div>
      </div>
    </div>
  )
}
