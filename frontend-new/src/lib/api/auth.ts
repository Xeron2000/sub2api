import { apiClient } from "./client"

export type LoginRequest = { email: string; password: string }
export type LoginResponse = { access_token: string; refresh_token: string; user: { id: number; email: string; role: string } }

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload)
  return data as unknown as LoginResponse
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me")
  return data
}
