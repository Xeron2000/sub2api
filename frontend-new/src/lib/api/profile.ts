import { apiClient } from "./client"

export type UserProfile = {
  id: number
  email: string
  username?: string
  display_name?: string
  avatar_url?: string | null
  role?: string
  totp_enabled: boolean
  passkey_enabled?: boolean
  balance?: number
  quota?: number
  created_at?: string
  updated_at?: string | null
  email_verified?: boolean
  is_simple_mode?: boolean
  status?: string
}

export async function getProfile(opts?: { signal?: AbortSignal }): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/user/profile", { signal: opts?.signal })
  return data
}

export async function updateProfile(payload: { username?: string; avatar_url?: string | null }): Promise<UserProfile> {
  const { data } = await apiClient.put<UserProfile>("/user", payload)
  return data
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>("/user/password", payload)
  return data
}

export async function stepUpTotp(code: string): Promise<unknown> {
  const { data } = await apiClient.post("/auth/totp/step-up", { code })
  return data
}
