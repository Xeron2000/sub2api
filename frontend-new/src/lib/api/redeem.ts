import { apiClient } from "./client"

export type RedeemHistoryItem = {
  id: number
  code: string
  type: string
  value: number
  status: string
  used_at: string
  created_at: string
  notes?: string
  group_id?: number
  validity_days?: number
  group?: { id: number; name: string }
}

export type RedeemResult = {
  message: string
  type: string
  value: number
  new_balance?: number
  new_concurrency?: number
}

export async function redeemCode(code: string): Promise<RedeemResult> {
  const { data } = await apiClient.post<RedeemResult>("/redeem", { code })
  return data
}

export async function getRedeemHistory(opts?: { signal?: AbortSignal }): Promise<RedeemHistoryItem[]> {
  const { data } = await apiClient.get<RedeemHistoryItem[]>("/redeem/history", { signal: opts?.signal })
  return data
}
