import { apiClient } from "../client"

export async function listChannels(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/channels", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function getChannel(id: number|string, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get(`/admin/channels/${id}`, { signal: options?.signal })
  return data
}
export async function createChannel(payload: unknown) { const { data } = await apiClient.post("/admin/channels", payload); return data }
export async function updateChannel(id: number|string, payload: unknown) { const { data } = await apiClient.put(`/admin/channels/${id}`, payload); return data }
export async function deleteChannel(id: number|string) { const { data } = await apiClient.delete(`/admin/channels/${id}`); return data }
export const channelsAPI = { list: listChannels, getById: getChannel, create: createChannel, update: updateChannel, delete: deleteChannel }
export default channelsAPI
