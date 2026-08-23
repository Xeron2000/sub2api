import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { MetricCard } from "@/components/shared/MetricCard"

export function OpsPage() {
  const { data } = useQuery({
    queryKey: ["ops-dashboard"],
    queryFn: async () => {
      const res = await httpClient.get("/admin/ops/dashboard/snapshot-v2")
      return res.data
    },
  })
  const d = data as Record<string, number> | undefined
  return (
    <Page>
      <PageHeader title="Ops Monitoring" description="Realtime traffic, concurrency and errors." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Concurrency" value={d?.["concurrency"] ?? 0} />
        <MetricCard label="QPS" value={d?.["qps"] ?? 0} />
        <MetricCard label="Errors" value={d?.["errors"] ?? 0} />
      </div>
      <Section title="Alerts"><Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Alert rules / events via /admin/ops/alert-*</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">WS QPS at /admin/ops/ws/qps — poll staleTimer 5s.</CardContent></Card></Section>
    </Page>
  )
}
