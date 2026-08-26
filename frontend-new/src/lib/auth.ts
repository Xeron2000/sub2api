export type AuthStatus = "unknown" | "anonymous" | "authenticated"

export type AuthUser = { id: number; email: string; role: string }

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("auth_user")
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed.id === "number" && typeof parsed.email === "string") return parsed
    return null
  } catch {
    return null
  }
}

export function getAuthStatus(): AuthStatus {
  if (typeof window === "undefined") return "unknown"
  const token = localStorage.getItem("auth_token")
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
