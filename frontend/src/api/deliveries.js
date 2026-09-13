import { client } from './client'

export const listProjectDeliveries = (projectId) =>
  client.get(`/api/projects/${projectId}/deliveries`).then((r) => r.data)
export const createProjectDelivery = (projectId, data) =>
  client.post(`/api/projects/${projectId}/deliveries`, data).then((r) => r.data)
export const createMilestoneDelivery = (milestoneId, data) =>
  client.post(`/api/milestones/${milestoneId}/deliveries`, data).then((r) => r.data)
export const updateDelivery = (id, data) => client.patch(`/api/deliveries/${id}`, data).then((r) => r.data)
export const updateDeliveryStatus = (id, status, notes) =>
  client.patch(`/api/deliveries/${id}/status`, { status, client_response_notes: notes }).then((r) => r.data)
export const deleteDelivery = (id) => client.delete(`/api/deliveries/${id}`).then((r) => r.data)
