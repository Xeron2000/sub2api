import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminPaymentAPI } from "@/lib/api/admin/payment"

export const Route = createFileRoute("/admin/orders/dashboard")({ component: OrdersDashboardPage })

function OrdersDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "orders", "dashboard"],
    queryFn: async () => {
      const { data } = await adminPaymentAPI.getDashboard()
      return data
    },
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.paymentDashboard" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{query.data?.total_orders ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(query.data?.total_revenue ?? 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
