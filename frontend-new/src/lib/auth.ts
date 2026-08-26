export type AuthStatus = "unknown" | "anonymous" | "authenticated"

export type AuthUser = { id: number; email: string; role: string; is_simple_mode?: boolean; run_mode?: string }

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage
  try {
    // vitest jsdom globals
    const g = globalThis as unknown as { localStorage?: Storage }
    if (g.localStorage) return g.localStorage
  } catch {}
  return null
}

export function getStoredUser(): AuthUser | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem("auth_user")
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed.id === "number" && typeof parsed.email === "string") return parsed
    return null
  } catch {
    return null
  }
}

export function getIsSimpleMode(): boolean {
  const u = getStoredUser()
  if (!u) return false
  if (typeof u.is_simple_mode === "boolean") return u.is_simple_mode
  if (typeof u.run_mode === "string") return u.run_mode === "simple"
  // fallback: check localStorage run_mode cached separately if present
  try {
    const storage = getStorage()
    if (storage?.getItem("run_mode") === "simple") return true
  } catch {}
  return false
}

export function getAuthStatus(): AuthStatus {
  if (typeof window === "undefined") return "unknown"
  const storage = getStorage()
  if (!storage) return "anonymous"
  const token = storage.getItem("auth_token")
  const user = getStoredUser()
  if (token && user) return "authenticated"
  if (!token && !user) return "anonymous"
  // inconsistent state treated as anonymous to force re-login
  return "anonymous"
}

export function isAuthenticated(): boolean {
  return getAuthStatus() === "authenticated"
}

export function isAdmin(): boolean {
  const u = getStoredUser()
  return u?.role === "admin"
}

export function requireAuth(redirectTo: string): void {
  if (typeof window === "undefined") return
  const status = getAuthStatus()
  if (status === "anonymous") {
    const url = `/login?redirect=${encodeURIComponent(redirectTo)}`
    if (window.location.pathname !== "/login") window.location.href = url
  }
}

export function requireAdmin(): boolean {
  return isAdmin()
}
