import { apiClient } from "./client"

export const paymentAPI = {
  getConfig() {
    return apiClient.get("/payment/config")
  },
  getPlans(opts?: { signal?: AbortSignal }) {
    return apiClient.get("/payment/plans", { signal: opts?.signal })
  },
  getCheckoutInfo() {
    return apiClient.get("/payment/checkout-info")
  },
  getLimits() {
    return apiClient.get("/payment/limits")
  },
  createOrder(data: unknown) {
    return apiClient.post("/payment/orders", data)
  },
  getMyOrders(params?: Record<string, unknown>, opts?: { signal?: AbortSignal }) {
    return apiClient.get("/payment/orders/my", { params, signal: opts?.signal })
  },
  getOrder(id: number | string) {
    return apiClient.get(`/payment/orders/${id}`)
  },
  cancelOrder(id: number | string) {
    return apiClient.post(`/payment/orders/${id}/cancel`)
  },
  verifyOrder(outTradeNo: string) {
    return apiClient.post("/payment/orders/verify", { out_trade_no: outTradeNo })
  },
  verifyOrderPublic(outTradeNo: string) {
    return apiClient.post("/payment/public/orders/verify", { out_trade_no: outTradeNo })
  },
  resolveOrderPublicByResumeToken(resumeToken: string) {
    return apiClient.post("/payment/public/orders/resolve", { resume_token: resumeToken })
  },
  requestRefund(id: number | string, data: { reason: string }) {
    return apiClient.post(`/payment/orders/${id}/refund-request`, data)
  },
  getRefundEligibleProviders() {
    return apiClient.get("/payment/orders/refund-eligible-providers")
  },
}
