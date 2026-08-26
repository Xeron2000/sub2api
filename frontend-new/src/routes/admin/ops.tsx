import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/ops")({ component: OpsPage })

function OpsPage() {
  const query = useQuery({
    queryKey: ["admin", "ops", "overview"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/ops/overview")
      return data as { uptime: string; requests: number }
    },
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.ops.title" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {query.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-sm">Uptime: {query.data?.uptime ?? "-"}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.requests ?? "-"}</p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">OpsDashboard placeholder — 15 ops/components via opsAPI (overview, throughput, latency, errors, concurrency, alerts, etc.)</p>
      </PageContainer>
    </AdminShell>
  )
}
