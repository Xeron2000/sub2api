import { apiClient } from "../client"

export const adminPaymentAPI = {
  getConfig: () => apiClient.get("/admin/payment/config"),
  updateConfig: (data: unknown) => apiClient.put("/admin/payment/config", data),
  getDashboard: (days?: number) => apiClient.get("/admin/payment/dashboard", { params: days ? { days } : undefined }),
  getOrders: (params?: Record<string, unknown>) => apiClient.get("/admin/payment/orders", { params }),
  getOrder: (id: number | string) => apiClient.get(`/admin/payment/orders/${id}`),
  cancelOrder: (id: number | string) => apiClient.post(`/admin/payment/orders/${id}/cancel`),
  retryRecharge: (id: number | string) => apiClient.post(`/admin/payment/orders/${id}/retry`),
  refundOrder: (id: number | string, data: unknown) => apiClient.post(`/admin/payment/orders/${id}/refund`, data),
  queryRefund: (id: number | string) => apiClient.post(`/admin/payment/orders/${id}/refund/query`),
  getChannels: () => apiClient.get("/admin/payment/channels"),
  createChannel: (data: unknown) => apiClient.post("/admin/payment/channels", data),
  updateChannel: (id: number | string, data: unknown) => apiClient.put(`/admin/payment/channels/${id}`, data),
  deleteChannel: (id: number | string) => apiClient.delete(`/admin/payment/channels/${id}`),
  getPlans: () => apiClient.get("/admin/payment/plans"),
  createPlan: (data: unknown) => apiClient.post("/admin/payment/plans", data),
  updatePlan: (id: number | string, data: unknown) => apiClient.put(`/admin/payment/plans/${id}`, data),
  deletePlan: (id: number | string) => apiClient.delete(`/admin/payment/plans/${id}`),
  getProviders: () => apiClient.get("/admin/payment/providers"),
  createProvider: (data: unknown) => apiClient.post("/admin/payment/providers", data),
  updateProvider: (id: number | string, data: unknown) => apiClient.put(`/admin/payment/providers/${id}`, data),
  deleteProvider: (id: number | string) => apiClient.delete(`/admin/payment/providers/${id}`),
}
export default adminPaymentAPI
