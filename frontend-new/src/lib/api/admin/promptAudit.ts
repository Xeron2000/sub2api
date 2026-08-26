import { apiClient } from "../client"

export async function listPromptAudits(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/prompt-audit", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export const promptAuditAPI = { list: listPromptAudits }
export default promptAuditAPI
