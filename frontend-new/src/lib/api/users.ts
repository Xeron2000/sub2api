import { apiClient } from "./client"

export type AdminUser = { id: number; email: string; role: string; status: string; created_at?: string }

export type PaginatedUsers = { items: AdminUser[]; total: number; page: number; page_size: number; pages: number }

export async function listUsers(params: { page: number; page_size: number; search?: string }, opts?: { signal?: AbortSignal }): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>("/admin/users", { params, signal: opts?.signal })
  return data
}

export async function updateUser(id: number, payload: Record<string, unknown>): Promise<AdminUser> {
  const { data } = await apiClient.put<AdminUser>(`/admin/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`)
}
