import { client } from './client'

export const listMilestones = (projectId) => client.get(`/api/projects/${projectId}/milestones`).then((r) => r.data)
export const createMilestone = (projectId, data) =>
  client.post(`/api/projects/${projectId}/milestones`, data).then((r) => r.data)
export const getMilestone = (id) => client.get(`/api/milestones/${id}`).then((r) => r.data)
export const updateMilestone = (id, data) => client.patch(`/api/milestones/${id}`, data).then((r) => r.data)
export const deleteMilestone = (id) => client.delete(`/api/milestones/${id}`).then((r) => r.data)
export const overrideMilestoneStatus = (id, status) =>
  client.patch(`/api/milestones/${id}/status`, { status }).then((r) => r.data)
