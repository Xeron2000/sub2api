import { apiClient } from "../client"

export async function getPaymentDashboard(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/payment/dashboard", { params, signal: options?.signal })
  return data
}
export async function listOrders(params: Record<string, unknown> = {}, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/payment/orders", { params, signal: options?.signal })
  return data as { items?: unknown[]; total?: number }
}
export async function listPlans(options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/payment/plans", { signal: options?.signal })
  return data as { items?: unknown[] }
}
export async function createPlan(payload: unknown) { const { data } = await apiClient.post("/admin/payment/plans", payload); return data }
export async function updatePlan(id: number|string, payload: unknown) { const { data } = await apiClient.put(`/admin/payment/plans/${id}`, payload); return data }
export async function deletePlan(id: number|string) { const { data } = await apiClient.delete(`/admin/payment/plans/${id}`); return data }
export async function cancelOrder(id: number|string) { const { data } = await apiClient.post(`/admin/payment/orders/${id}/cancel`); return data }
export const ordersAPI = { getDashboard: getPaymentDashboard, listOrders, listPlans, createPlan, updatePlan, deletePlan, cancelOrder }
export default ordersAPI
