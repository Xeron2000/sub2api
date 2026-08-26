import { apiClient } from "../client"

export type AdminComplianceStatus = {
  required: boolean
  version: string
  ack_phrase_zh?: string
  ack_phrase_en?: string
  ack_phrase?: string
  document_path_zh?: string
  document_path_en?: string
  document_url_zh?: string
  document_url_en?: string
}

export async function getComplianceStatus(options?: { signal?: AbortSignal }): Promise<AdminComplianceStatus> {
  const { data } = await apiClient.get<AdminComplianceStatus>("/admin/compliance", { signal: options?.signal })
  return data
}

export async function acceptCompliance(payload: { phrase: string; language: string }): Promise<AdminComplianceStatus> {
  const { data } = await apiClient.post<AdminComplianceStatus>("/admin/compliance/accept", payload)
  return data
}

export const adminComplianceAPI = { getStatus: getComplianceStatus, accept: acceptCompliance }
export default adminComplianceAPI
