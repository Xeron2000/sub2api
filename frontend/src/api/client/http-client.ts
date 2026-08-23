import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

export type ApiError = {
  status?: number
  code?: string | number
  message: string
  details?: unknown
  metadata?: Record<string, unknown>
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1"

export const httpClient = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, "") || "/api/v1",
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("auth_token")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.headers) {
    const lang = localStorage.getItem("sub2api_locale") || "en"
    config.headers["Accept-Language"] = lang
  }
  if (config.method === "get") {
    config.params = { ...(config.params || {}), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  }
  return config
})

httpClient.interceptors.response.use(
  (res) => {
    const data = res.data as { code?: number; message?: string; data?: unknown; reason?: string; metadata?: unknown }
    if (data && typeof data === "object" && "code" in data) {
      if (data.code === 0) {
        res.data = data.data
        return res
      }
      return Promise.reject({
        status: res.status,
        code: data.code,
        message: data.message || "Unknown error",
        details: data.reason,
        metadata: data.metadata,
      } as ApiError)
    }
    return res
  },
  (error: AxiosError<{ code?: number; message?: string; reason?: string }>) => {
    if (error.code === "ERR_CANCELED") return Promise.reject(error)
    if (error.response) {
      const { status, data } = error.response
      const d = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>
      if (status === 401) {
        const hasRefresh = !!localStorage.getItem("refresh_token")
        if (!hasRefresh) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
        }
      }
      return Promise.reject({
        status,
        code: (d.code as number) ?? status,
        message: (d.message as string) || error.message,
        details: d.reason,
        metadata: d.metadata,
      } as ApiError)
    }
    return Promise.reject({ message: error.message || "Network error" } as ApiError)
  }
)

export function getApiBaseURL(): string {
  return API_BASE_URL
}
