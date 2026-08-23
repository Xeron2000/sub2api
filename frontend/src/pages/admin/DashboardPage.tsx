import { Page, PageHeader, Section } from "@/components/shared/Page"
import { MetricCard } from "@/components/shared/MetricCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"
import { t } from "@/i18n"

export function DashboardPageAdmin() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await httpClient.get("/admin/dashboard/stats")
      return res.data as Record<string, number>
    },
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  const d = (data as Record<string, number>) || {}
  return (
    <Page>
      <PageHeader title={t("admin.dashboard.title") as string || "Admin Dashboard"} description="System overview." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Users" value={d.users ?? 0} />
        <MetricCard label="Requests" value={d.requests ?? 0} />
        <MetricCard label="Channels" value={d.channels ?? 0} />
        <MetricCard label="Tokens" value={d.tokens ?? 0} />
      </div>
      <Section title="Realtime"><Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Snapshot V2</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Connects to /admin/dashboard/snapshot-v2 and /admin/ops/dashboard/*</CardContent></Card></Section>
    </Page>
  )
}

export const DashboardPage = DashboardPageAdmin
