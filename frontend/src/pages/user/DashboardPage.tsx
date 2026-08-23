import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { dashboardKeys } from "@/api/query-keys"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { MetricCard } from "@/components/shared/MetricCard"
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { normalizeError } from "@/api/errors/normalize-error"
import { t } from "@/i18n"
import { useTheme } from "@/components/theme-provider"

type Stats = { total_users?: number; total_requests?: number; active_channels?: number; total_tokens?: number }

export function DashboardPage() {
  const { theme } = useTheme()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const res = await httpClient.get<Stats>("/dashboard/stats")
      return res.data as Stats
    },
    retry: false,
  })

  if (isLoading) return <LoadingState />
  if (error) {
    const n = normalizeError(error)
    return <ErrorState message={n.message} onRetry={() => refetch()} />
  }
  if (!data) return <EmptyState title="No data" description="Dashboard has no data yet." />

  return (
    <Page>
      <PageHeader title={t("dashboard.title")} description={`${t("dashboard.welcomeMessage")} — ${theme} mode`} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Users" value={data.total_users ?? 0} hint="All accounts" />
        <MetricCard label="Total Requests" value={data.total_requests ?? 0} hint="Last 30 days" />
        <MetricCard label="Active Channels" value={data.active_channels ?? 0} hint="Healthy" />
        <MetricCard label="Tokens" value={data.total_tokens ?? 0} hint="Consumed" />
      </div>
      <Section title="Usage Trend" description="Daily request volume">
        <Card className="rounded-none">
          <CardHeader><CardTitle className="text-sm">Trend placeholder — chart connects to /usage/dashboard/trend</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">Chart renders when data is available. Empty state handled via shared pattern. Current theme: {theme}. Locale: {t("nav.dashboard")}.</CardContent>
        </Card>
      </Section>
    </Page>
  )
}
