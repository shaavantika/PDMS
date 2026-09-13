import { client } from './client'

export const listUsers = () => client.get('/api/users').then((r) => r.data)
export const listPendingUsers = () => client.get('/api/users/pending').then((r) => r.data)
export const approveUser = (id) => client.post(`/api/users/${id}/approve`).then((r) => r.data)
export const rejectUser = (id) => client.post(`/api/users/${id}/reject`).then((r) => r.data)
export const createUser = (data) => client.post('/api/users', data).then((r) => r.data)
export const updateUser = (id, data) => client.patch(`/api/users/${id}`, data).then((r) => r.data)
export const deleteUser = (id) => client.delete(`/api/users/${id}`).then((r) => r.data)
