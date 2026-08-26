import { apiClient } from "../client"

export type AdminDashboardStats = {
  total_users: number
  total_keys: number
  today_requests?: number
  today_tokens?: number
  total_requests?: number
  active_requests?: number
  requests_per_minute?: number
  average_response_time?: number
  error_rate?: number
  [k: string]: unknown
}

export async function getDashboardStats(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get<AdminDashboardStats>("/admin/dashboard/stats", { signal: options?.signal })
  return data
}

export async function getRealtimeMetrics(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/dashboard/realtime", { signal: options?.signal })
  return data
}

export const dashboardAPI = { getStats: getDashboardStats, getRealtimeMetrics }
export default dashboardAPI
