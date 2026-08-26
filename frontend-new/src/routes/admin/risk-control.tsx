import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/risk-control")({ component: RiskControlPage })

function RiskControlPage() {
  const query = useQuery({
    queryKey: ["admin", "risk-control"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/risk-control/config")
      return data as { enabled: boolean; mode: string }
    },
  })

  if (query.isError && (query.error as { status?: number })?.status === 404) {
    return (
      <AdminShell>
        <PageContainer>
          <p className="text-sm text-muted-foreground">Risk control is disabled (risk_control_enabled=false).</p>
        </PageContainer>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.riskControl.title" />
        <div className="mt-6">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Config</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Enabled: {String(query.data?.enabled ?? "-")}</p>
                <p className="text-sm text-muted-foreground">Mode: {query.data?.mode ?? "-"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </AdminShell>
  )
}
