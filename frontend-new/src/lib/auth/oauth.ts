/**
 * OAuth Shared Architecture — Goal 5
 * Single source of truth for all provider callbacks.
 * Prevents duplicated session logic across LinuxDo/DingTalk/WeChat/OIDC.
 */

import { apiClient } from "@/lib/api/client"
import { persistAuthTokens } from "@/lib/api/auth"

export type OAuthCallbackState = {
  state: string
  nonce?: string
  pkceVerifier?: string
  redirect?: string
  createdAt: number
  provider: string
}

export type OAuthCallbackResult = {
  ok: boolean
  requiresEmail?: boolean
  pendingToken?: string
  errorCode?: string
  errorDescription?: string
}

// Storage: sessionStorage preferred (session-scoped, not persistent)
const STATE_KEY_PREFIX = "oauth_state_"

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    if (window.sessionStorage) return window.sessionStorage
  } catch {}
  try {
    const g = globalThis as unknown as { localStorage?: Storage }
    return g.localStorage ?? null
  } catch {
    return null
  }
}

export function saveOAuthState(state: OAuthCallbackState): void {
  const s = storage()
  if (!s) return
  s.setItem(`${STATE_KEY_PREFIX}${state.provider}`, JSON.stringify(state))
}

export function loadOAuthState(provider: string): OAuthCallbackState | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(`${STATE_KEY_PREFIX}${provider}`)
    if (!raw) return null
    return JSON.parse(raw) as OAuthCallbackState
  } catch {
    return null
  }
}

export function clearOAuthState(provider: string): void {
  const s = storage()
  if (!s) return
  s.removeItem(`${STATE_KEY_PREFIX}${provider}`)
}

/**
 * Strict same-origin internal redirect resolver.
 * Prevents open redirect: only allows paths starting with / and not // or scheme.
 */
export function safeRedirect(input: string | null | undefined, fallback = "/dashboard"): string {
  if (!input) return fallback
  const trimmed = input.trim()
  if (!trimmed) return fallback
  // Block absolute URLs, protocol-relative, and javascript: schemes
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return fallback
  if (trimmed.startsWith("//")) return fallback
  if (!trimmed.startsWith("/")) return fallback
  // Block // encoded or control chars
  if (trimmed.includes("://")) return fallback
  // Normalize but keep as-is for internal routing; block path traversal that escapes? Still same origin.
  // Prevent open redirect to external via encoded
  try {
    const decoded = decodeURIComponent(trimmed)
    if (/^[a-z][a-z\d+.-]*:/i.test(decoded) || decoded.startsWith("//")) return fallback
  } catch {}
  return trimmed
}

export function clearSensitiveParamsFromURL(paramsToRemove: string[] = ["code", "state", "error", "error_description"]): void {
  if (typeof window === "undefined") return
  try {
    const url = new URL(window.location.href)
    let changed = false
    for (const p of paramsToRemove) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p)
        changed = true
      }
    }
    if (changed) {
      window.history.replaceState({}, "", url.pathname + url.search + url.hash)
    }
  } catch {}
}

export function normalizeOAuthError(error: unknown): { code: string; message: string; recoverable: boolean } {
  const msg = (error as { message?: string })?.message ?? ""
  const code = (error as { code?: string })?.code ?? (error as { response?: { data?: { code?: string } } })?.response?.data?.code ?? ""
  // Provider error taxonomy
  if (code === "oauth_state_mismatch" || msg.includes("state")) return { code: "state_invalid", message: "Invalid session state. Please try logging in again.", recoverable: true }
  if (msg.includes("expired") || code === "expired_flow") return { code: "expired_flow", message: "This login session has expired. Please start again.", recoverable: true }
  if (msg.includes("denied") || code === "access_denied" || code === "user_denied") return { code: "user_denied", message: "You denied access. You can try again with another method.", recoverable: true }
  if (code === "account_conflict") return { code: "account_conflict", message: "This provider account is already linked to another user.", recoverable: true }
  if (code === "email_required" || msg.includes("email required")) return { code: "email_required", message: "Additional information required to complete sign-in.", recoverable: true }
  if (code === "provider_unavailable" || msg.includes("provider")) return { code: "provider_unavailable", message: "Provider is temporarily unavailable. Please retry.", recoverable: true }
  if (!msg && !code) return { code: "backend_error", message: "Authentication failed. Please try again.", recoverable: true }
  return { code: code || "backend_error", message: msg || "Authentication failed. Please try again.", recoverable: true }
}

/**
 * Single-flight OAuth login completion: persisting session and invalidating.
 * Must not bypass the existing token refresh / session race architecture.
 */
export async function completeOAuthLogin(data: unknown): Promise<void> {
  // Data expected shape: { access_token, refresh_token, expires_in, user }
  const payload = data as { access_token?: string; refresh_token?: string; expires_in?: number; user?: unknown }
  if (payload?.access_token) {
    persistAuthTokens(payload as never)
    // Invalidate auth queries so UI reflects new session immediately
    try {
      const { queryClient } = await import("@/lib/query/client")
      // Best-effort: if queryClient available via global, invalidate
      // Fallback: dispatch event for AppShell to refetch
      if (queryClient) {
        const qc = queryClient as unknown as { invalidateQueries?: (opts: unknown) => void }
        if (qc.invalidateQueries) qc.invalidateQueries({ queryKey: ["auth"] })
      }
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: payload }))
    }
  }
}

export async function handleOAuthCallback(opts: {
  provider: string
  code: string | null
  state: string | null
  error?: string | null
  errorDescription?: string | null
  redirectParam?: string | null
  apiPath: string
}): Promise<{ success: boolean; redirectTo?: string; requiresEmail?: boolean; error?: { code: string; message: string } }> {
  // 1. Provider error
  if (opts.error) {
    const e = normalizeOAuthError({ code: opts.error, message: opts.errorDescription ?? opts.error })
    clearSensitiveParamsFromURL()
    return { success: false, error: e }
  }
  if (!opts.code) {
    clearSensitiveParamsFromURL()
    return { success: false, error: { code: "missing_code", message: "Missing authorization code." } }
  }
  // 2. State validation if we have stored state
  const stored = loadOAuthState(opts.provider)
  if (stored) {
    if (opts.state && stored.state !== opts.state) {
      clearSensitiveParamsFromURL()
      clearOAuthState(opts.provider)
      return { success: false, error: { code: "state_invalid", message: "Invalid session state. Please try again." } }
    }
    // optional: expiry 10min
    if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
      clearSensitiveParamsFromURL()
      clearOAuthState(opts.provider)
      return { success: false, error: { code: "expired_flow", message: "This login session has expired. Please start again." } }
    }
  }

  try {
    const params: Record<string, string> = { code: opts.code }
    if (opts.state) params.state = opts.state
    if (stored?.pkceVerifier) params.code_verifier = stored.pkceVerifier
    const { data } = await apiClient.get(opts.apiPath, { params })
    const d = data as Record<string, unknown>
    clearSensitiveParamsFromURL()
    clearOAuthState(opts.provider)

    // Branch: requires extra input (DingTalk email)
    if (d?.requires_email === true || d?.requires_extra_input === true || (d as { pending_token?: string })?.pending_token) {
      // Persist pending token in sessionStorage for email-completion
      if (typeof window !== "undefined" && (d as { pending_token?: string }).pending_token) {
        try { window.sessionStorage.setItem("pending_oauth_token", String((d as { pending_token?: string }).pending_token)) } catch {}
        if (d?.pending_token && opts.provider === "dingtalk") {
          return { success: true, requiresEmail: true }
        }
      }
      if ((d as { requires_email?: boolean }).requires_email) return { success: true, requiresEmail: true }
    }

    await completeOAuthLogin(d)
    const redirectTo = safeRedirect(opts.redirectParam ?? stored?.redirect ?? new URLSearchParams(window.location.search).get("redirect") ?? new URLSearchParams(window.location.search).get("next"))
    return { success: true, redirectTo }
  } catch (e) {
    clearSensitiveParamsFromURL()
    clearOAuthState(opts.provider)
    const norm = normalizeOAuthError(e)
    return { success: false, error: norm }
  }
}
