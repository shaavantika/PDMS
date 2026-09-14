import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listGroups, createGroup, updateGroup, deleteGroup } from '../../api/groups'
import { DataTable } from '../../components/DataTable'
import { Modal } from '../../components/Modal'
import { apiErrorMessage } from '../../api/client'

const PAGES = [
  { key: 'projects', label: 'Projects' },
  { key: 'modules', label: 'Modules' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'deliveries', label: 'Deliveries' },
]

function emptyPermissions() {
  const perms = {}
  PAGES.forEach((p) => {
    perms[p.key] = { can_read: false, can_write: false }
  })
  return perms
}

function permissionsToMap(permissions = []) {
  const perms = emptyPermissions()
  permissions.forEach((p) => {
    perms[p.page] = { can_read: p.can_read, can_write: p.can_write }
  })
  return perms
}

function permissionsToPayload(perms) {
  return PAGES.map((p) => ({ page: p.key, ...perms[p.key] }))
}

function PermissionGrid({ permissions, onChange }) {
  const setPage = (key, next) => onChange({ ...permissions, [key]: next })

  return (
    <div style={{ marginBottom: 18 }}>
      <label className="field-label">Page Permissions</label>
      <div className="card" style={{ padding: '8px 12px' }}>
        {PAGES.map((p) => {
          const perm = permissions[p.key]
          return (
            <div
              key={p.key}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: 14 }}>{p.label}</span>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={perm.can_read}
                    onChange={(e) => {
                      const can_read = e.target.checked
                      setPage(p.key, { can_read, can_write: can_read ? perm.can_write : false })
                    }}
                  />
                  Read
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={perm.can_write}
                    onChange={(e) => {
                      const can_write = e.target.checked
                      setPage(p.key, { can_read: can_write ? true : perm.can_read, can_write })
                    }}
                  />
                  Write
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GroupFormModal({ title, initialName = '', initialDescription = '', initialPermissions = emptyPermissions(), submitLabel, isPending, error, onSubmit, onClose }) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [permissions, setPermissions] = useState(initialPermissions)

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ name, description, permissions: permissionsToPayload(permissions) })
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Name *</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Description</label>
          <textarea className="input" value={description || ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <PermissionGrid permissions={permissions} onChange={setPermissions} />
        {error && <div style={{ color: 'var(--status-red-text)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function GroupManagementPage() {
  const queryClient = useQueryClient()
  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: listGroups })

  const [showCreate, setShowCreate] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [error, setError] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['groups'] })

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      invalidate()
      setShowCreate(false)
      setError('')
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateGroup(id, data),
    onSuccess: () => {
      invalidate()
      setEditingGroup(null)
      setError('')
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: invalidate,
    onError: (err) => window.alert(apiErrorMessage(err)),
  })

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description', render: (g) => g.description || '—' },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (g) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {g.permissions
            .filter((p) => p.can_read || p.can_write)
            .map((p) => (
              <span
                key={p.page}
                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-alt)', border: '1px solid var(--border)' }}
              >
                {p.page} · {p.can_write ? 'RW' : 'R'}
              </span>
            ))}
          {g.permissions.every((p) => !p.can_read && !p.can_write) && <span style={{ color: 'var(--text-muted)' }}>None</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (g) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditingGroup(g)}>
            Edit
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => {
              if (window.confirm(`Delete group "${g.name}"?`)) deleteMutation.mutate(g.id)
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">User Groups</div>
          <div className="page-subtitle">Control which pages each group can read or edit.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Group
        </button>
      </div>

      {isLoading ? <div>Loading...</div> : <DataTable columns={columns} rows={groups} emptyMessage="No groups yet." />}

      {showCreate && (
        <GroupFormModal
          title="Create Group"
          submitLabel="Create Group"
          isPending={createMutation.isPending}
          error={error}
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => {
            setShowCreate(false)
            setError('')
          }}
        />
      )}

      {editingGroup && (
        <GroupFormModal
          title={`Edit "${editingGroup.name}"`}
          submitLabel="Save Changes"
          initialName={editingGroup.name}
          initialDescription={editingGroup.description}
          initialPermissions={permissionsToMap(editingGroup.permissions)}
          isPending={updateMutation.isPending}
          error={error}
          onSubmit={(data) => updateMutation.mutate({ id: editingGroup.id, data })}
          onClose={() => {
            setEditingGroup(null)
            setError('')
          }}
        />
      )}
    </div>
  )
}
