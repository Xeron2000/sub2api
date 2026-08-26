import { apiClient } from "../client"

export async function listSubscriptions(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/subscriptions", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function assignSubscription(payload: unknown) { const { data } = await apiClient.post("/admin/subscriptions/assign", payload); return data }
export async function extendSubscription(id: number|string, payload: unknown) { const { data } = await apiClient.post(`/admin/subscriptions/${id}/extend`, payload); return data }
export async function revokeSubscription(id: number|string) { const { data } = await apiClient.post(`/admin/subscriptions/${id}/revoke`); return data }
export async function restoreSubscription(id: number|string) { const { data } = await apiClient.post(`/admin/subscriptions/${id}/restore`); return data }
export async function resetQuota(id: number|string) { const { data } = await apiClient.post(`/admin/subscriptions/${id}/reset-quota`); return data }
export const subscriptionsAPI = { list: listSubscriptions, assign: assignSubscription, extend: extendSubscription, revoke: revokeSubscription, restore: restoreSubscription, resetQuota }
export default subscriptionsAPI
