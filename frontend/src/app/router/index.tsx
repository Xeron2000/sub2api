import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/app/layouts/AppShell"
import { DashboardPage } from "@/pages/user/DashboardPage"
import { UsersPage } from "@/pages/admin/UsersPage"
import { ChannelsPage } from "@/pages/admin/ChannelsPage"
import { LoginPage } from "@/pages/auth/LoginPage"

function Protected({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const token = localStorage.getItem("auth_token")
  if (!token) return <Navigate to="/login" replace />
  if (admin) {
    try {
      const u = JSON.parse(localStorage.getItem("auth_user") || "null")
      if (u?.role !== "admin") return <Navigate to="/dashboard" replace />
    } catch { return <Navigate to="/dashboard" replace /> }
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppShell><DashboardPage /></AppShell>,
    children: [],
  },
  { path: "/dashboard", element: <Protected><AppShell><DashboardPage /></AppShell></Protected> },
  { path: "/admin/users", element: <Protected admin><AppShell><UsersPage /></AppShell></Protected> },
  { path: "/admin/channels/pricing", element: <Protected admin><AppShell><ChannelsPage /></AppShell></Protected> },
  { path: "/home", element: <AppShell><DashboardPage /></AppShell> },
  { path: "*", element: <div className="p-8 text-sm">Not Found</div> },
])
