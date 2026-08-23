import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { MetricCard } from "@/components/shared/MetricCard"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

type Snapshot = { concurrency: number; qps: number; errors: number; uptime_seconds?: number }

export function OpsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ops-dashboard"],
    queryFn: async () => {
      const res = await httpClient.get<Snapshot>("/admin/ops/dashboard/snapshot-v2")
      return res.data as Snapshot
    },
    refetchInterval: 5000,
    retry: false,
  })
  const alertsQ = useQuery({
    queryKey: ["ops-alerts"],
    queryFn: async () => {
      const res = await httpClient.get("/admin/ops/alert-rules")
      return res.data
    },
    retry: false,
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  const d = data as Snapshot | undefined
  return (
    <Page>
      <PageHeader title="Ops Monitoring" description="Realtime traffic, concurrency and errors — auto refresh 5s." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Concurrency" value={d?.concurrency ?? 0} hint="Active workers" />
        <MetricCard label="QPS" value={d?.qps ?? 0} hint="Requests / sec" />
        <MetricCard label="Errors" value={d?.errors ?? 0} hint="Last minute" />
      </div>
      <Section title="Alert Rules">
        <Card className="rounded-none">
          <CardHeader><CardTitle className="text-sm">Alert Configuration</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {alertsQ.isLoading ? <p className="text-muted-foreground">Loading alert rules...</p> : alertsQ.error ? <p className="text-muted-foreground">No alert rules — configure via /admin/ops/alert-rules.</p> : <pre className="text-xs bg-muted p-3 overflow-auto max-h-64">{JSON.stringify(alertsQ.data, null, 2)}</pre>}
            <p className="text-xs text-muted-foreground mt-2">Polling snapshot-v2 every 5s; QPS stream available at /admin/ops/ws/qps via WebSocket.</p>
          </CardContent>
        </Card>
      </Section>
    </Page>
  )
}
