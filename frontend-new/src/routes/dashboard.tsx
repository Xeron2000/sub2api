import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { queryKeys } from "@/lib/query/keys"
import { getCurrentUser } from "@/lib/api/auth"
import { getDashboardStats } from "@/lib/api/usage"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/dashboard" } as Record<string, string> })
    }
  },
  component: DashboardPage,
})

function StatCard({
  titleKey,
  value,
  loading,
}: {
  titleKey?: string
  value: string
  loading?: boolean
}) {
  const { t } = useTranslation()
  if (loading) return <Skeleton className="h-24 w-full" />
  const resolved = titleKey ? t(titleKey) : ""
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{resolved}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold font-mono">{value}</p>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const { t } = useTranslation()

  const userQuery = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => getCurrentUser(),
    retry: false,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.usage.dashboard(),
    queryFn: ({ signal }) => getDashboardStats({ signal }),
    retry: false,
  })

  const isLoading = userQuery.isLoading || statsQuery.isLoading
  const hasError = userQuery.error || statsQuery.error
  const errorMessage = userQuery.error
    ? getAppErrorMessage(userQuery.error)
    : statsQuery.error
      ? getAppErrorMessage(statsQuery.error)
      : null

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="dashboard.title" descriptionKey="dashboard.welcomeMessage" />
        <div className="mt-6 space-y-6">
          {hasError ? (
            <ErrorState
              message={errorMessage || t("common.unknownError")}
              onRetry={() => {
                if (userQuery.error) userQuery.refetch()
                if (statsQuery.error) statsQuery.refetch()
              }}
            />
          ) : isLoading ? (
            <LoadingState />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard titleKey="common.role" value={userQuery.data?.role ?? "-"} />
                <StatCard
                  titleKey="keys.title"
                  value={statsQuery.data?.total_keys != null ? String(statsQuery.data.total_keys) : "-"}
                />
                <StatCard
                  titleKey="nav.usage"
                  value={statsQuery.data?.total_usage != null ? String(statsQuery.data.total_usage) : "-"}
                />
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
