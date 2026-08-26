import { apiClient } from "../client"

export async function listChannelMonitors(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/channel-monitors", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export const channelMonitorAPI = { list: listChannelMonitors }
export default channelMonitorAPI
