import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/shared/ErrorState"
import { queryKeys } from "@/lib/query/keys"
import { getDashboardStats } from "@/lib/api/admin/dashboard"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: createAdminGuard(),
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.admin.dashboard.stats(),
    queryFn: ({ signal }) => getDashboardStats({ signal }),
  })

  if (query.isError) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.dashboard.title" />
          <div className="mt-6">
            <ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} />
          </div>
        </PageContainer>
      </AdminShell>
    )
  }

  if (query.isLoading) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.dashboard.title" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-6 w-12 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </AdminShell>
    )
  }

  const stats = (query.data ?? {}) as Record<string, unknown>
  const val = (k: string) => (stats[k] as number | string | undefined) ?? "-"

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.dashboard.title" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("admin.dashboard.totalUsers") ?? "Total Users"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{String(val("total_users"))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("admin.dashboard.totalKeys") ?? "Total Keys"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{String(val("total_keys"))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("admin.dashboard.todayRequests") ?? "Today Requests"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{String(val("today_requests"))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("admin.dashboard.todayTokens") ?? "Today Tokens"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{String(val("today_tokens"))}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
