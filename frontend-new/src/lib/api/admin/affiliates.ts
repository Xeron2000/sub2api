import { apiClient } from "../client"

export async function listAffiliateInvites(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/affiliates/invites", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function listAffiliateRebates(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/affiliates/rebates", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function listAffiliateTransfers(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/affiliates/transfers", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export const affiliatesAPI = { listInvites: listAffiliateInvites, listRebates: listAffiliateRebates, listTransfers: listAffiliateTransfers }
export default affiliatesAPI
