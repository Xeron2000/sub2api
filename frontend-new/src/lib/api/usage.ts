import { apiClient } from "./client"

export type DashboardStats = { total_keys?: number; total_usage?: number; balance?: number }

export async function getDashboardStats(opts?: { signal?: AbortSignal }): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/usage/dashboard/stats", { signal: opts?.signal })
  return data
}
