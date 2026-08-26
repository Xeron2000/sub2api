import axios from "axios"
import type {AxiosError, InternalAxiosRequestConfig, AxiosResponse} from "axios";
import { getLocale } from "@/i18n"
import { ADMIN_UI_REQUEST_HEADER, USER_UI_REQUEST_HEADER, shouldMarkAdminUIRequest, shouldMarkUserUIRequest } from "./adminUIRequest"
import { refreshAuthTokens } from "./tokenRefresh"
import { getAPIBaseURL } from "./url"

export { buildApiUrl, buildGatewayUrl } from "./url"
export { AppError, toAppError, getAppErrorMessage } from "./errors"

type ApiEnvelope<T> = { code: number; message?: string; data: T; reason?: string; metadata?: Record<string, unknown> }

export const apiClient = axios.create({
  baseURL: getAPIBaseURL(),
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
    if (config.headers) config.headers["Accept-Language"] = getLocale()
    if (config.method === "get") {
      config.params = { ...(config.params || {}), timezone: getUserTimezone() }
    }
    if (config.headers) {
      const url = String(config.url || "")
      if (shouldMarkAdminUIRequest(url)) config.headers[ADMIN_UI_REQUEST_HEADER] = "1"
      if (shouldMarkUserUIRequest(url)) config.headers[USER_UI_REQUEST_HEADER] = "1"
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res: AxiosResponse) => {
    const data = res.data as Record<string, unknown> | null
    // cache ops enabled on success (clear disabled flag)
    try {
      const url = String(res.config?.url || "")
      if (url.includes("/admin/ops/overview") && res.status >= 200 && res.status < 300) {
        localStorage.setItem("ops_monitoring_enabled_cached", "true")
      }
      // cache payment/risk from successful settings fetch
      if (url.includes("/admin/settings") && res.status >= 200 && res.status < 300) {
        const payload = data && typeof data === "object" && "data" in data ? (data as ApiEnvelope<Record<string, unknown>>).data : data as Record<string, unknown> | null
        if (payload && typeof payload === "object") {
          if (typeof payload.payment_enabled === "boolean") localStorage.setItem("payment_enabled_cached", String(payload.payment_enabled))
          if (typeof payload.risk_control_enabled === "boolean") localStorage.setItem("risk_control_enabled_cached", String(payload.risk_control_enabled))
          if (typeof payload.ops_monitoring_enabled === "boolean") localStorage.setItem("ops_monitoring_enabled_cached", String(payload.ops_monitoring_enabled))
        } else if (data && typeof data === "object" && "payment_enabled" in data) {
          // already unwrapped case
          const d = data as Record<string, unknown>
          if (typeof d.payment_enabled === "boolean") localStorage.setItem("payment_enabled_cached", String(d.payment_enabled))
          if (typeof d.risk_control_enabled === "boolean") localStorage.setItem("risk_control_enabled_cached", String(d.risk_control_enabled))
          if (typeof d.ops_monitoring_enabled === "boolean") localStorage.setItem("ops_monitoring_enabled_cached", String(d.ops_monitoring_enabled))
        }
      }
    } catch {}
    if (data && typeof data === "object" && "code" in data) {
      const envelope = data as ApiEnvelope<unknown>
      if (envelope.code === 0) {
        res.data = envelope.data
        return res
      }
      return Promise.reject({
        status: res.status,
        code: envelope.code,
        message: envelope.message || "Unknown error",
        reason: envelope.reason,
        metadata: envelope.metadata,
      })
    }
    return res
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (error.code === "ERR_CANCELED" || axios.isCancel(error)) return Promise.reject(error)
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response) {
      const { status, data } = error.response
      const url = String(error.config?.url || "")
      const apiData = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>

      if (status === 404 && apiData.message === "Ops monitoring is disabled") {
        try {
          localStorage.setItem("ops_monitoring_enabled_cached", "false")
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent("ops-monitoring-disabled"))
        } catch {}
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin/ops")) window.location.href = "/admin/settings"
        return Promise.reject({ status, code: "OPS_DISABLED", message: String(apiData.message || error.message), url })
      }
      if (status === 423 && apiData.code === "ADMIN_COMPLIANCE_ACK_REQUIRED") {
        try {
          window.dispatchEvent(new CustomEvent("admin-compliance-required", { detail: apiData.metadata || {} }))
        } catch {}
        return Promise.reject({ status, code: apiData.code, message: String(apiData.message || error.message), metadata: apiData.metadata })
      }

      if (status === 401 && originalRequest && !originalRequest._retry) {
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
        const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")
        if (refreshToken && !isAuthEndpoint) {
          const refreshSessionUser = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null
          originalRequest._retry = true
          try {
            const headers = originalRequest.headers as Record<string, unknown> | undefined
            const authHeader = headers?.Authorization ?? headers?.authorization
            const failedAccessToken =
              typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null
            const tokens = await refreshAuthTokens({ failedAccessToken })
            if (originalRequest.headers) (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${tokens.access_token}`
            return apiClient(originalRequest)
          } catch {
            const sessionChanged =
              typeof window !== "undefined" &&
              (localStorage.getItem("refresh_token") !== refreshToken ||
                localStorage.getItem("auth_user") !== refreshSessionUser)
            if (sessionChanged) {
              return Promise.reject({ status: 401, code: "AUTH_SESSION_CHANGED", message: "Authentication session changed while refreshing." })
            }
            if (typeof window !== "undefined") {
              localStorage.removeItem("auth_token")
              localStorage.removeItem("refresh_token")
              localStorage.removeItem("auth_user")
              localStorage.removeItem("token_expires_at")
              try { sessionStorage.setItem("auth_expired", "1") } catch {}
              if (!window.location.pathname.includes("/login")) window.location.href = "/login"
            }
            return Promise.reject({ status: 401, code: "TOKEN_REFRESH_FAILED", message: "Session expired. Please log in again." })
          }
        }
        // no refresh token path: clear and redirect
        if (typeof window !== "undefined") {
          const hasToken = !!localStorage.getItem("auth_token")
          const headers = error.config?.headers as Record<string, unknown> | undefined
          const authHeader = headers?.Authorization ?? headers?.authorization
          const sentAuth = typeof authHeader === "string" ? authHeader.trim() !== "" : Array.isArray(authHeader) ? authHeader.length > 0 : !!authHeader
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("auth_user")
          localStorage.removeItem("token_expires_at")
          if ((hasToken || sentAuth) && !url.includes("/auth/login") && !url.includes("/auth/register") && !url.includes("/auth/refresh")) {
            try { sessionStorage.setItem("auth_expired", "1") } catch {}
          }
          if (!window.location.pathname.includes("/login")) window.location.href = "/login"
        }
      }

      return Promise.reject({
        status,
        code: (apiData.code as string | number | undefined) ?? status,
        reason: apiData.reason as string | undefined,
        message: (apiData.message as string) || (apiData.detail as string) || error.message,
        metadata: apiData.metadata as Record<string, unknown> | undefined,
      })
    }
    return Promise.reject({ status: 0, message: "Network error. Please check your connection." })
  },
)

export function getErrorMessage(err: unknown): string {
  const e = err as Record<string, unknown>
  return (e?.message as string) || "Unknown error"
}
