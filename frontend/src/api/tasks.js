import { client } from './client'

export const listAllTasks = (assigneeMe = false) =>
  client.get('/api/tasks', { params: assigneeMe ? { assignee: 'me' } : {} }).then((r) => r.data)
export const listRequirementTasks = (requirementId) =>
  client.get(`/api/requirements/${requirementId}/tasks`).then((r) => r.data)
export const createRequirementTask = (requirementId, data) =>
  client.post(`/api/requirements/${requirementId}/tasks`, data).then((r) => r.data)
export const createProjectTask = (projectId, data) =>
  client.post(`/api/projects/${projectId}/tasks`, data).then((r) => r.data)
export const getTask = (id) => client.get(`/api/tasks/${id}`).then((r) => r.data)
export const updateTask = (id, data) => client.patch(`/api/tasks/${id}`, data).then((r) => r.data)
export const deleteTask = (id) => client.delete(`/api/tasks/${id}`).then((r) => r.data)
export const updateTaskStatus = (id, status, progressPct) =>
  client.patch(`/api/tasks/${id}/status`, { status, progress_pct: progressPct }).then((r) => r.data)
