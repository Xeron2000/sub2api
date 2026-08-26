import { apiClient } from "./client"

export type UsageQueryParams = {
  page?: number
  page_size?: number
  search?: string
  model?: string
  group_id?: number
  api_key_id?: number
  request_type?: string
  billing_type?: number | null
  billing_mode?: string | null
  start_date?: string
  end_date?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
  timezone?: string
  stream?: boolean
}

export type UsageLog = {
  id: number
  api_key_id?: number
  api_key?: { name: string }
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens?: number
  cache_creation_tokens?: number
  total_cost: number
  actual_cost: number
  rate_multiplier?: number
  duration_ms?: number | null
  first_token_ms?: number | null
  created_at: string
  group_id?: number | null
  billing_mode?: string | null
  [key: string]: unknown
}

export type PaginatedUsage = { items: UsageLog[]; total: number; page: number; page_size: number }

export type UsageStatsResponse = {
  total_requests: number
  total_tokens: number
  total_cost: number
  total_actual_cost: number
  [key: string]: unknown
}

export async function listUsage(params: UsageQueryParams, opts?: { signal?: AbortSignal }): Promise<PaginatedUsage> {
  const { data } = await apiClient.get<PaginatedUsage>("/usage", { params, signal: opts?.signal })
  return data
}

export async function getUsageStats(params: UsageQueryParams, opts?: { signal?: AbortSignal }): Promise<UsageStatsResponse> {
  const { data } = await apiClient.get<UsageStatsResponse>("/usage/stats", { params, signal: opts?.signal })
  return data
}

// Key-usage (public): query by API key via Bearer header
export type KeyUsageQuota = { used: number; limit: number; remaining: number }
export type KeyUsageResponse = {
  quota?: KeyUsageQuota
  usage?: { today?: { requests: number; total_tokens: number }; total?: { requests: number } }
  model_stats?: Array<{ model: string; requests: number; total_tokens: number }>
}

export async function getDashboardStats(opts?: { signal?: AbortSignal }): Promise<{ total_requests?: number; total_tokens?: number; total_cost?: number; total_actual_cost?: number } & Record<string, unknown>> {
  const { data } = await apiClient.get("/usage/dashboard/stats", { signal: opts?.signal })
  return data as { total_requests?: number; total_tokens?: number; total_cost?: number; total_actual_cost?: number } & Record<string, unknown>
}

export async function getKeyUsage(apiKey: string, params?: { start_date?: string; end_date?: string; timezone?: string }): Promise<KeyUsageResponse> {
  const search = new URLSearchParams()
  if (params?.start_date) search.set("start_date", params.start_date)
  if (params?.end_date) search.set("end_date", params.end_date)
  if (params?.timezone) search.set("timezone", params.timezone)
  const qs = search.toString()
  const { data } = await apiClient.get<KeyUsageResponse>(`/usage${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  return data
}
