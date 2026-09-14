import { client } from './client'

export const listGroups = () => client.get('/api/groups').then((r) => r.data)
export const getGroup = (id) => client.get(`/api/groups/${id}`).then((r) => r.data)
export const createGroup = (data) => client.post('/api/groups', data).then((r) => r.data)
export const updateGroup = (id, data) => client.patch(`/api/groups/${id}`, data).then((r) => r.data)
export const deleteGroup = (id) => client.delete(`/api/groups/${id}`).then((r) => r.data)
