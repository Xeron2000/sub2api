import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { PublicShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { getAuthStatus } from "@/lib/auth"

export const Route = createFileRoute("/model-plaza")({ component: ModelPlazaPage })

function ModelPlazaPage() {
  const { t } = useTranslation()
  // Public settings matrix per docs/frontend-route-policy.md §69 / frontend-special-flows.md §2.7
  const settingsQuery = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/settings/public")
        const inner = (data as { data?: Record<string, unknown> })?.data ?? data
        return inner as Record<string, unknown>
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: 60_000,
  })

  const settings = settingsQuery.data as Record<string, unknown> | null | undefined
  const enabled = settings?.model_plaza_enabled as boolean | undefined
  const requireAuth = settings?.model_plaza_require_auth as boolean | undefined
  const backendMode = settings?.backend_mode_enabled as boolean | undefined
  const authStatus = typeof window !== "undefined" ? getAuthStatus() : "unknown"

  // Apply matrix before fetching models — but do not fake disabled on settings load failure
  if (typeof window !== "undefined" && settingsQuery.isSuccess && settings !== null) {
    if (enabled === false) {
      // fail-closed: redirect per role (old router) — but backend 404 also handled below
      if (authStatus === "authenticated") {
        try {
          const user = JSON.parse(localStorage.getItem("auth_user") ?? "null") as { role?: string } | null
          window.location.href = user?.role === "admin" ? "/admin/dashboard" : "/dashboard"
        } catch {
          window.location.href = "/dashboard"
        }
      } else {
        window.location.href = "/home"
      }
      return null as unknown as React.ReactElement
    }
    if (requireAuth === true && authStatus === "anonymous") {
      window.location.href = "/login?redirect=/model-plaza"
      return null as unknown as React.ReactElement
    }
    if (backendMode === true && authStatus === "authenticated") {
      try {
        const user = JSON.parse(localStorage.getItem("auth_user") ?? "null") as { role?: string } | null
        if (user?.role !== "admin") {
          window.location.href = "/login"
          return null as unknown as React.ReactElement
        }
      } catch {}
    }
  }

  const query = useQuery({
    queryKey: ["model-plaza"],
    queryFn: async () => {
      const { data } = await apiClient.get("/model-plaza")
      return data as { models?: Array<{ id: string; name: string }> }
    },
    retry: false,
  })

  // 401 fallback: Backend is source of truth for require_auth when settings not yet loaded
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (!token && query.isError && (query.error as { status?: number })?.status === 401) {
      window.location.href = "/login?redirect=/model-plaza"
      // @ts-expect-error -- narrow type after Goal2 freeze
      return null as React.ReactElement
    }
  }

  // Gate handling: if backend returns 404 or disabled, show message (backend is source of truth)
  if (query.isLoading) {
    return (
      <PublicShell>
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </PublicShell>
    )
  }

  if (query.isError) {
    const status = (query.error as { status?: number })?.status
    if (status === 404) {
      return (
        <PublicShell>
          <PageContainer>
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Model plaza is disabled.</p>
              <Button asChild className="mt-4">
                <Link to="/home">{t("common.back")}</Link>
              </Button>
            </div>
          </PageContainer>
        </PublicShell>
      )
    }
    return (
      <PublicShell>
        <PageContainer>
          <ErrorState message={(query.error as { message?: string })?.message ?? "Failed to load"} onRetry={() => query.refetch()} />
        </PageContainer>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Model Plaza</h1>
        <p className="mt-2 text-sm text-muted-foreground">Available models</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {query.data?.models?.length ? (
            query.data.models.map((m) => (
              <div key={m.id} className="rounded-lg border p-4">
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.id}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No models available.</p>
          )}
        </div>
      </PageContainer>
    </PublicShell>
  )
}

