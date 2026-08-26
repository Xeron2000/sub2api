import { apiClient } from "../client"

export async function listPromoCodes(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/promo-codes", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function createPromoCode(payload: unknown) { const { data } = await apiClient.post("/admin/promo-codes", payload); return data }
export async function deletePromoCode(id: number|string) { const { data } = await apiClient.delete(`/admin/promo-codes/${id}`); return data }
export const promoAPI = { list: listPromoCodes, create: createPromoCode, delete: deletePromoCode }
export default promoAPI
