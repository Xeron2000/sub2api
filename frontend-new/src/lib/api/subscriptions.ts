import { apiClient } from "./client"

export type UserSubscription = {
  id: number
  group_id: number
  group?: {
    name: string
    platform?: string
    description?: string
    rate_multiplier?: number
    daily_limit_usd?: number | null
    weekly_limit_usd?: number | null
    monthly_limit_usd?: number | null
  }
  status: string
  expires_at?: string | null
  daily_usage_usd?: number | null
  weekly_usage_usd?: number | null
  monthly_usage_usd?: number | null
  daily_window_start?: string | null
  weekly_window_start?: string | null
  monthly_window_start?: string | null
}

export async function getMySubscriptions(opts?: { signal?: AbortSignal }): Promise<UserSubscription[]> {
  const { data } = await apiClient.get<UserSubscription[]>("/subscriptions", { signal: opts?.signal })
  return data
}

export async function getActiveSubscriptions(opts?: { signal?: AbortSignal }): Promise<UserSubscription[]> {
  const { data } = await apiClient.get<UserSubscription[]>("/subscriptions/active", { signal: opts?.signal })
  return data
}

export async function getSubscriptionsProgress(opts?: { signal?: AbortSignal }): Promise<unknown> {
  const { data } = await apiClient.get("/subscriptions/progress", { signal: opts?.signal })
  return data
}
