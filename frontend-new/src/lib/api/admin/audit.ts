import { apiClient } from "../client"

export type AuditLogQuery = {
  page?: number
  page_size?: number
  search?: string
  actor_email?: string
  action?: string
  method?: string
  client_ip?: string
  start_time?: string
  end_time?: string
}

export async function listAuditLogs(params: AuditLogQuery = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/audit-logs", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number; [k: string]: unknown }
}

export async function getAuditLog(id: number | string, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get(`/admin/audit-logs/${id}`, { signal: options?.signal })
  return data
}

export async function clearAuditLogs(totpCode: string) {
  const { data } = await apiClient.post("/admin/audit-logs/clear", { totp_code: totpCode })
  return data
}

export const auditAPI = { list: listAuditLogs, getById: getAuditLog, clear: clearAuditLogs }
export default auditAPI
