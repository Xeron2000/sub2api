import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { PublicShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/model-plaza")({ component: ModelPlazaPage })

function ModelPlazaPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ["model-plaza"],
    queryFn: async () => {
      const { data } = await apiClient.get("/model-plaza")
      return data as { models?: Array<{ id: string; name: string }> }
    },
    retry: false,
  })

  // Gates: model_plaza_enabled (404) and model_plaza_require_auth (redirect to /login if no token)
  // Backend is source of truth for enabled; require_auth is enforced via 401 + redirect
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (!token && query.isError && (query.error as { status?: number })?.status === 401) {
      window.location.href = "/login?redirect=/model-plaza"
      return null as unknown as React.ReactElement
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


