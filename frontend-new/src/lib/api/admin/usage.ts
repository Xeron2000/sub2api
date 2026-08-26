import { apiClient } from "../client"

export type AdminUsageQuery = {
  page?: number
  page_size?: number
  search?: string
  user_id?: number
  api_key_id?: number
  group_id?: number
  model?: string
  start_date?: string
  end_date?: string
  timezone?: string
}

export async function listUsage(params: AdminUsageQuery = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/usage", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number; [k: string]: unknown }
}

export async function getUsageStats(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/usage/stats", { params, signal: options?.signal })
  return data
}

export const usageAPI = { list: listUsage, getStats: getUsageStats }
export default usageAPI
