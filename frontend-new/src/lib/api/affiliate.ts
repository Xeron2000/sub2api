import { apiClient } from "./client"

export type AffiliateDetail = {
  aff_code: string
  aff_count: number
  aff_quota: number
  aff_history_quota: number
  effective_rebate_rate_percent: number
}

export type AffiliateInvitee = {
  id: number
  username?: string
  email?: string
  created_at: string
  quota?: number
}

export type AffiliateTransferResponse = { message: string; transferred?: number }

export async function getAffiliateDetail(opts?: { signal?: AbortSignal }): Promise<AffiliateDetail> {
  const { data } = await apiClient.get<AffiliateDetail>("/user/affiliate/detail", { signal: opts?.signal })
  return data
}

export async function getAffiliateInvitees(opts?: { signal?: AbortSignal }): Promise<AffiliateInvitee[]> {
  const { data } = await apiClient.get<AffiliateInvitee[]>("/user/affiliate/invitees", { signal: opts?.signal })
  return data
}

export async function transferAffiliate(): Promise<AffiliateTransferResponse> {
  const { data } = await apiClient.post<AffiliateTransferResponse>("/user/affiliate/transfer")
  return data
}
