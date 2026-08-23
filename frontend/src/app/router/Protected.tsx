import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

export function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const token = localStorage.getItem("auth_token")
  if (!token) return <Navigate to="/login" replace />
  if (admin) {
    try {
      const u = JSON.parse(localStorage.getItem("auth_user") || "null") as { role?: string } | null
      if (u?.role !== "admin") return <Navigate to="/dashboard" replace />
    } catch {
      return <Navigate to="/dashboard" replace />
    }
  }
  return <>{children}</>
}
