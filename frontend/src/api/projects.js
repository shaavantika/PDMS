import { client } from './client'

export const listProjects = () => client.get('/api/projects').then((r) => r.data)
export const getProject = (id) => client.get(`/api/projects/${id}`).then((r) => r.data)
export const createProject = (data) => client.post('/api/projects', data).then((r) => r.data)
export const updateProject = (id, data) => client.patch(`/api/projects/${id}`, data).then((r) => r.data)
export const deleteProject = (id) => client.delete(`/api/projects/${id}`).then((r) => r.data)
export const addProjectMember = (id, userId) =>
  client.post(`/api/projects/${id}/members`, { user_id: userId }).then((r) => r.data)
export const removeProjectMember = (id, userId) =>
  client.delete(`/api/projects/${id}/members/${userId}`).then((r) => r.data)
