import { apiClient } from "../client"

export async function getRiskConfig(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/risk-control/config", { signal: options?.signal })
  return data as { enabled: boolean; mode?: string }
}
export async function updateRiskConfig(payload: unknown) { const { data } = await apiClient.put("/admin/risk-control/config", payload); return data }
export const riskAPI = { getConfig: getRiskConfig, updateConfig: updateRiskConfig }
export default riskAPI
