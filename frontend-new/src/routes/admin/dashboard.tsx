import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboardPage })

function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/dashboard/stats")
      return data as { total_users: number; total_keys: number; today_requests: number; today_tokens: number }
    },
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.dashboard.title" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.total_users ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.total_keys ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Today Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.today_requests ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Today Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.today_tokens ?? "-"}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
