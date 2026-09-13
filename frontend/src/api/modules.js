import { client } from './client'

export const listModules = (projectId) => client.get(`/api/projects/${projectId}/modules`).then((r) => r.data)
export const createModule = (projectId, data) =>
  client.post(`/api/projects/${projectId}/modules`, data).then((r) => r.data)
export const getModule = (id) => client.get(`/api/modules/${id}`).then((r) => r.data)
export const updateModule = (id, data) => client.patch(`/api/modules/${id}`, data).then((r) => r.data)
export const deleteModule = (id) => client.delete(`/api/modules/${id}`).then((r) => r.data)
