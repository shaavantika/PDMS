import { client } from './client'

export const listRequirements = (moduleId) =>
  client.get(`/api/modules/${moduleId}/requirements`).then((r) => r.data)
export const createRequirement = (moduleId, data) =>
  client.post(`/api/modules/${moduleId}/requirements`, data).then((r) => r.data)
export const getRequirement = (id) => client.get(`/api/requirements/${id}`).then((r) => r.data)
export const updateRequirement = (id, data) => client.patch(`/api/requirements/${id}`, data).then((r) => r.data)
export const deleteRequirement = (id) => client.delete(`/api/requirements/${id}`).then((r) => r.data)
export const approveRequirement = (id) => client.post(`/api/requirements/${id}/approve`).then((r) => r.data)
export const rejectRequirement = (id) => client.post(`/api/requirements/${id}/reject`).then((r) => r.data)
export const listPendingRequirements = (projectId) =>
  client.get(`/api/projects/${projectId}/requirements/pending`).then((r) => r.data)
