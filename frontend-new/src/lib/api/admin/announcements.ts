import { apiClient } from "../client"

export async function list(
  page = 1,
  pageSize = 20,
  filters?: Record<string, unknown>,
  options?: { signal?: AbortSignal },
) {
  const { data } = await apiClient.get("/admin/announcements", {
    params: { page, page_size: pageSize, ...filters },
    signal: options?.signal,
  })
  return data
}

export async function getById(id: number) {
  const { data } = await apiClient.get(`/admin/announcements/${id}`)
  return data
}

export async function create(data: unknown) {
  const res = await apiClient.post("/admin/announcements", data)
  return res.data
}

export async function update(id: number, data: unknown) {
  const res = await apiClient.put(`/admin/announcements/${id}`, data)
  return res.data
}

export async function deleteAnnouncement(id: number) {
  const res = await apiClient.delete(`/admin/announcements/${id}`)
  return res.data
}

export async function getReadStatus(id: number, page = 1, pageSize = 20, filters?: Record<string, unknown>, options?: { signal?: AbortSignal }) {
  const { data } = await apiClient.get(`/admin/announcements/${id}/read-status`, {
    params: { page, page_size: pageSize, ...filters },
    signal: options?.signal,
  })
  return data
}

export const announcementsAPI = { list, getById, create, update, delete: deleteAnnouncement, getReadStatus }
export default announcementsAPI
