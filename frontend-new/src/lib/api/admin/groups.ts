import { apiClient } from "../client"

export async function listGroups(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/groups", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function getGroup(id: number|string, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get(`/admin/groups/${id}`, { signal: options?.signal })
  return data
}
export async function createGroup(payload: unknown) {
  const { data } = await apiClient.post("/admin/groups", payload)
  return data
}
export async function updateGroup(id: number|string, payload: unknown) {
  const { data } = await apiClient.put(`/admin/groups/${id}`, payload)
  return data
}
export async function deleteGroup(id: number|string) {
  const { data } = await apiClient.delete(`/admin/groups/${id}`)
  return data
}
export const groupsAPI = { list: listGroups, getById: getGroup, create: createGroup, update: updateGroup, delete: deleteGroup }
export default groupsAPI
