import { apiClient } from "../client"

export async function getOpsOverview(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/ops/overview", { signal: options?.signal })
  return data as { uptime?: string; requests?: number }
}
export const opsAPI = { getOverview: getOpsOverview }
export default opsAPI
