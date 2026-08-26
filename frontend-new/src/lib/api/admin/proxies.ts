import { apiClient } from "../client"

export async function list(page = 1, pageSize = 20, filters?: Record<string, unknown>, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get("/admin/proxies", { params: { page, page_size: pageSize, ...filters }, signal: options?.signal })
  return data
}
export async function getAll() {
  const { data } = await apiClient.get("/admin/proxies/all")
  return data
}
export async function getAllWithCount() {
  const { data } = await apiClient.get("/admin/proxies/all", { params: { with_count: "true" } })
  return data
}
export async function getById(id: number) {
  const { data } = await apiClient.get(`/admin/proxies/${id}`)
  return data
}
export async function create(data: unknown) {
  const res = await apiClient.post("/admin/proxies", data)
  return res.data
}
export async function update(id: number, data: unknown) {
  const res = await apiClient.put(`/admin/proxies/${id}`, data)
  return res.data
}
export async function deleteProxy(id: number) {
  const res = await apiClient.delete(`/admin/proxies/${id}`)
  return res.data
}
export async function toggleStatus(id: number, status: string) {
  return update(id, { status })
}
export async function testProxy(id: number) {
  const { data } = await apiClient.post(`/admin/proxies/${id}/test`)
  return data
}
export async function checkProxyQuality(id: number) {
  const { data } = await apiClient.post(`/admin/proxies/${id}/quality-check`)
  return data
}
export async function getStats(id: number) {
  const { data } = await apiClient.get(`/admin/proxies/${id}/stats`)
  return data
}
export async function getProxyAccounts(id: number) {
  const { data } = await apiClient.get(`/admin/proxies/${id}/accounts`)
  return data
}
export async function batchCreate(proxies: unknown[]) {
  const { data } = await apiClient.post("/admin/proxies/batch", { proxies })
  return data
}
export async function batchDelete(ids: number[]) {
  const { data } = await apiClient.post("/admin/proxies/batch-delete", { ids })
  return data
}
export async function exportData(options?: unknown) {
  const { data } = await apiClient.get("/admin/proxies/data", { params: options as Record<string, unknown> })
  return data
}
export async function importData(payload: unknown) {
  const { data } = await apiClient.post("/admin/proxies/data", payload)
  return data
}

export const proxiesAPI = { list, getAll, getAllWithCount, getById, create, update, delete: deleteProxy, toggleStatus, testProxy, checkProxyQuality, getStats, getProxyAccounts, batchCreate, batchDelete, exportData, importData }
export default proxiesAPI
