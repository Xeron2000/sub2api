import { apiClient } from "../client"

export type AdminSettings = Record<string, unknown> & {
  site_name?: string
  payment_enabled?: boolean
  risk_control_enabled?: boolean
  ops_monitoring_enabled?: boolean
  custom_menu_items?: unknown[]
}

export async function getSettings(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get<AdminSettings>("/admin/settings", { signal: options?.signal })
  return data
}

export async function updateSettings(payload: Record<string, unknown>) {
  const { data } = await apiClient.put("/admin/settings", payload)
  return data
}

export const settingsAPI = { getSettings, updateSettings, get: getSettings, update: updateSettings }
export default settingsAPI
