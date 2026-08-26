import { apiClient } from "./client"

export type LoginRequest = { email: string; password: string }
export type LoginResponse = {
  access_token: string
  refresh_token: string
  expires_in?: number
  token_type?: string
  user: { id: number; email: string; role: string; run_mode?: string }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload)
  return data
}

export async function getCurrentUser(): Promise<{ id: number; email: string; role: string }> {
  const { data } = await apiClient.get("/auth/me")
  return data as { id: number; email: string; role: string }
}

export function persistAuthTokens(data: LoginResponse): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_token", data.access_token)
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token)
  if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user))
  if (typeof data.expires_in === "number" && Number.isFinite(data.expires_in)) {
    localStorage.setItem("token_expires_at", String(Date.now() + data.expires_in * 1000))
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("auth_user")
  localStorage.removeItem("token_expires_at")
}
