import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouterState } from "@tanstack/react-router"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { useTranslation } from "@/i18n"
import { getRouteMeta } from "@/lib/routeMeta"
import { getAuthStatus, isAdmin } from "@/lib/auth"
import { AdminComplianceDialog } from "@/components/admin/AdminComplianceDialog"

function useDocumentTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { t, locale } = useTranslation()
  useEffect(() => {
    const meta = getRouteMeta(pathname)
    const siteName = "Sub2API"
    if (meta?.titleKey) {
      const title = t(meta.titleKey)
      document.title = title !== meta.titleKey ? `${title} - ${siteName}` : siteName
    } else {
      document.title = siteName
    }
  }, [pathname, locale, t])
}

export function AppShell({ children }: { children: ReactNode }) {
  useDocumentTitle()
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  useDocumentTitle()
  useEffect(() => {
    const pathname = window.location.pathname
    if (!pathname.startsWith("/admin")) return
    const status = getAuthStatus()
    if (status === "unknown") return
    if (status === "anonymous") {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`
      return
    }
    if (!isAdmin()) {
      window.location.href = "/dashboard"
    }
  }, [])
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
      <AdminComplianceDialog />
    </div>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  useDocumentTitle()
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export function AuthShell({ children }: { children: ReactNode }) {
  useDocumentTitle()
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
