import { apiClient } from "./client"

export type ApiKey = {
  id: number
  key: string
  name: string
  status: string
  group_id?: number | null
  quota?: number
  expires_at?: string | null
  created_at: string
  updated_at?: string
}

export type PaginatedKeys = { items: ApiKey[]; total: number; page: number; page_size: number; pages: number }

export async function listKeys(params: { page: number; page_size: number; search?: string }, opts?: { signal?: AbortSignal }): Promise<PaginatedKeys> {
  const { data } = await apiClient.get<PaginatedKeys>("/keys", { params, signal: opts?.signal })
  return data
}

export async function createKey(payload: { name: string; group_id?: number | null; custom_key?: string; quota?: number; expires_in_days?: number }): Promise<ApiKey> {
  const { data } = await apiClient.post<ApiKey>("/keys", payload)
  return data
}

export async function updateKey(id: number, payload: Partial<{ name: string; group_id: number | null }>): Promise<ApiKey> {
  const { data } = await apiClient.put<ApiKey>(`/keys/${id}`, payload)
  return data
}

export async function deleteKey(id: number): Promise<void> {
  await apiClient.delete(`/keys/${id}`)
}

export async function getKey(id: number): Promise<ApiKey> {
  const { data } = await apiClient.get<ApiKey>(`/keys/${id}`)
  return data
}
