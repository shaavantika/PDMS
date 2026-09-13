export function Modal({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 30, 61, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 480, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
