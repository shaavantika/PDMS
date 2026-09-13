import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUsers, createUser, updateUser, listPendingUsers, approveUser, rejectUser } from '../../api/users'
import { DataTable } from '../../components/DataTable'
import { Avatar } from '../../components/Avatar'
import { Modal } from '../../components/Modal'
import { apiErrorMessage } from '../../api/client'

const ROLES = ['admin', 'pm', 'member']

function PendingRegistrations() {
  const queryClient = useQueryClient()
  const { data: pending = [], isLoading } = useQuery({ queryKey: ['pending-users'], queryFn: listPendingUsers })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-users'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }
  const approveMutation = useMutation({ mutationFn: approveUser, onSuccess: invalidate })
  const rejectMutation = useMutation({ mutationFn: rejectUser, onSuccess: invalidate })

  if (isLoading || pending.length === 0) return null

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={u.name} size={22} />
          {u.name}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'created_at', header: 'Requested On', render: (u) => new Date(u.created_at).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => rejectMutation.mutate(u.id)}>
            Reject
          </button>
          <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => approveMutation.mutate(u.id)}>
            Approve
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Pending Registrations ({pending.length})</div>
      <DataTable columns={columns} rows={pending} />
    </div>
  )
}

export function UserManagementPage() {
  const queryClient = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'member' })
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUser(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateUser(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={u.name} size={22} />
          {u.name}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <select className="input" style={{ padding: '4px 8px', fontSize: 13, width: 110 }} value={u.role} onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (u) => (
        <input type="checkbox" checked={u.is_active} onChange={(e) => activeMutation.mutate({ id: u.id, is_active: e.target.checked })} />
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">Users</div>
          <div className="page-subtitle">Manage accounts and roles.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Add User
        </button>
      </div>
      <PendingRegistrations />

      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Active Users</div>
      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={users} />}

      {showCreate && (
        <Modal title="Add User" onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              createMutation.mutate(form)
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Email *</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Password *</label>
              <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Add User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
