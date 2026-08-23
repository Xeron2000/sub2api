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
type Trend = { date: string; requests: number }[]

export function DashboardPage() {
  const { theme } = useTheme()
  const statsQ = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const res = await httpClient.get<Stats>("/dashboard/stats")
      return res.data as Stats
    },
    retry: false,
  })
  const trendQ = useQuery({
    queryKey: ["dashboard-trend"],
    queryFn: async () => {
      const res = await httpClient.get<{ data: Trend } | Trend>("/user/usage/dashboard/trend")
      const d = res.data as unknown as { data?: Trend }
      return (Array.isArray(d) ? d : (d.data ?? [])) as Trend
    },
    retry: false,
  })
  if (statsQ.isLoading) return <LoadingState />
  if (statsQ.error) {
    const n = normalizeError(statsQ.error)
    return <ErrorState message={n.message} onRetry={() => statsQ.refetch()} />
  }
  if (!statsQ.data) return <EmptyState title="No data" description="Dashboard has no data yet." />
  const d = statsQ.data
  return (
    <Page>
      <PageHeader title={t("dashboard.title")} description={`${t("dashboard.welcomeMessage")} — ${theme} mode`} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Users" value={d.total_users ?? 0} hint="All accounts" />
        <MetricCard label="Total Requests" value={d.total_requests ?? 0} hint="Last 30 days" />
        <MetricCard label="Active Channels" value={d.active_channels ?? 0} hint="Healthy" />
        <MetricCard label="Tokens" value={d.total_tokens ?? 0} hint="Consumed" />
      </div>
      <Section title="Usage Trend" description="Daily request volume from /user/usage/dashboard/trend">
        <Card className="rounded-none">
          <CardHeader><CardTitle className="text-sm">Daily Requests</CardTitle></CardHeader>
          <CardContent>
            {trendQ.isLoading ? <p className="text-sm text-muted-foreground">Loading trend...</p> : trendQ.error ? <p className="text-sm text-destructive">{normalizeError(trendQ.error).message}</p> : (trendQ.data && trendQ.data.length > 0) ? (
              <div className="flex items-end gap-1 h-24">
                {trendQ.data.slice(-14).map((p) => {
                  const max = Math.max(...trendQ.data!.map(x => x.requests), 1)
                  const h = Math.max(4, Math.round((p.requests / max) * 80))
                  return <div key={p.date} className="flex-1 bg-primary" style={{ height: h }} title={`${p.date}: ${p.requests}`} />
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">No trend data yet — start making API calls to see usage.</p>}
            <p className="text-xs text-muted-foreground mt-2">Theme: {theme} · Locale: {t("nav.dashboard")}</p>
          </CardContent>
        </Card>
      </Section>
    </Page>
  )
}
