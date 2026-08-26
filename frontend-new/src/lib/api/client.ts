import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import { AppError } from "./errors"

function getBaseURL(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api/v1"
  return raw.replace(/\/+$/, "") || "/api/v1"
}

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
    if (config.headers) {
      const tz = (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
          return "UTC"
        }
      })()
      if (config.method === "get") {
        config.params = { ...(config.params || {}), timezone: tz }
      }
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res: AxiosResponse) => {
    const data = res.data as Record<string, unknown>
    if (data && typeof data === "object" && "code" in data) {
      if ((data as { code: number }).code === 0) {
        res.data = (data as { data: unknown }).data
      } else {
        const err = data as { code: number | string; message?: string; metadata?: Record<string, unknown> }
        return Promise.reject({ status: res.status, code: err.code, message: err.message || "Unknown error", metadata: err.metadata })
      }
    }
    return res
  },
  (error) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") return Promise.reject(error)
    if (error.response) {
      const { status, data } = error.response
      const apiData = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>
      if (status === 401 && typeof window !== "undefined") {
        const url = String(error.config?.url || "")
        const isAuth = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")
        if (!isAuth) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("auth_user")
          if (!window.location.pathname.includes("/login")) window.location.href = "/login"
        }
      }
      return Promise.reject({ status, code: apiData.code, message: (apiData.message as string) || error.message, metadata: apiData.metadata })
    }
    return Promise.reject({ status: 0, message: "Network error" })
  },
)

// helper to unwrap AppError for UI
export function getErrorMessage(err: unknown): string {
  const e = err as Record<string, unknown>
  return (e?.message as string) || "Unknown error"
}

export function buildGatewayUrl(path: string): string {
  const base = getBaseURL().replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  try {
    const origin = typeof window === "undefined" ? new URL(base).origin : new URL(base, window.location.origin).origin
    return `${origin}${suffix}`
  } catch {
    return suffix
  }
}

export { AppError }
