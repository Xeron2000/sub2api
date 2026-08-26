import { apiClient } from "../client"

export async function listRedeemCodes(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/redeem-codes", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function generateRedeemCodes(payload: unknown) { const { data } = await apiClient.post("/admin/redeem-codes/generate", payload); return data }
export async function deleteRedeemCode(id: number|string) { const { data } = await apiClient.delete(`/admin/redeem-codes/${id}`); return data }
export async function exportRedeemCodes(params: Record<string, unknown> = {}) { const { data } = await apiClient.get("/admin/redeem-codes/export", { params }); return data }
export const redeemAPI = { list: listRedeemCodes, generate: generateRedeemCodes, delete: deleteRedeemCode, export: exportRedeemCodes }
export default redeemAPI
