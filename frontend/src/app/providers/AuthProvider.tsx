import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "@/hooks/useAuth"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    const token = localStorage.getItem("auth_token")
    const userRaw = localStorage.getItem("auth_user")
    let parsed: { role?: string } | null
    try { parsed = userRaw ? (JSON.parse(userRaw) as { role?: string }) : null } catch { parsed = null }
    return {
      isAuthenticated: !!token,
      isAdmin: parsed?.role === "admin",
      user: parsed as { id: number; email: string; role: string } | null,
    }
  })

  useEffect(() => {
    // restore session: try fetch profile if token exists, else stay unauth
    if (!state.isAuthenticated) return
    // no actual fetch in skeleton; keep state
  }, [state.isAuthenticated])

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_user")
    setState({ isAuthenticated: false, isAdmin: false, user: null })
  }

  return <AuthContext.Provider value={{ ...state, logout }}>{children}</AuthContext.Provider>
}
