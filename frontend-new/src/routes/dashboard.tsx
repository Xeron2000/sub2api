import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { queryKeys } from "@/lib/query/keys"
import { apiClient } from "@/lib/api/client"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/dashboard")({ component: DashboardPage })

function StatCard({ title, titleKey, value, loading }: { title?: string; titleKey?: string; value: string; loading?: boolean }) {
  const { t } = useTranslation()
  const resolved = titleKey ? t(titleKey) : (title ?? "")
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{resolved}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const { t } = useTranslation()
  const userQuery = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me")
      return data as { email: string; role: string }
    },
    retry: false,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.usage.dashboard(),
    queryFn: async () => {
      const { data } = await apiClient.get("/usage/dashboard/stats").catch(() => ({ data: { total_keys: 0, total_usage: 0 } }))
      return data as { total_keys?: number; total_usage?: number; balance?: number }
    },
  })

  const isLoading = userQuery.isLoading || statsQuery.isLoading
  const error = (userQuery.error as { message?: string } | null)?.message || (statsQuery.error as { message?: string } | null)?.message

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="dashboard.title" descriptionKey="dashboard.welcomeMessage" />
        <div className="mt-6 space-y-6">
          {error ? (
            <ErrorState message={error} onRetry={() => { userQuery.refetch(); statsQuery.refetch() }} />
          ) : isLoading ? (
            <LoadingState />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard titleKey="common.role" value={userQuery.data?.role ?? "-"} />
                <StatCard titleKey="keys.title" value={String((statsQuery.data as { total_keys?: number })?.total_keys ?? "-")} />
                <StatCard titleKey="nav.usage" value={String((statsQuery.data as { total_usage?: number })?.total_usage ?? "-")} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("dashboard.quickActions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t("dashboard.startUsingApi")}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
