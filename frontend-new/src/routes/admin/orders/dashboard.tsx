import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { getPaymentDashboard } from "@/lib/api/admin/orders"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { ErrorState } from "@/components/shared/ErrorState"

export const Route = createFileRoute("/admin/orders/dashboard")({
  beforeLoad: createAdminGuard({ requirePayment: true }),
  component: OrdersDashboardPage,
})

function OrdersDashboardPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.admin.orders.dashboard(),
    queryFn: ({ signal }) => getPaymentDashboard({}, { signal }),
  })

  if (query.isError) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="nav.paymentDashboard" />
          <div className="mt-6"><ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
        </PageContainer>
      </AdminShell>
    )
  }

  if (query.isLoading) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="nav.paymentDashboard" />
          <div className="mt-6 grid gap-4 md:grid-cols-2"><Card className="animate-pulse"><CardHeader><div className="h-4 w-20 bg-muted rounded" /></CardHeader><CardContent><div className="h-6 w-12 bg-muted rounded" /></CardContent></Card><Card className="animate-pulse"><CardHeader><div className="h-4 w-20 bg-muted rounded" /></CardHeader><CardContent><div className="h-6 w-12 bg-muted rounded" /></CardContent></Card></div>
        </PageContainer>
      </AdminShell>
    )
  }

  const d = (query.data ?? {}) as Record<string, unknown>
  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.paymentDashboard" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{t("admin.orders.totalOrders") ?? "Total Orders"}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{String(d["total_orders"] ?? d["order_count"] ?? "-")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{t("admin.orders.totalRevenue") ?? "Total Revenue"}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${Number(d["total_revenue"] ?? d["revenue"] ?? 0).toFixed(2)}</p></CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
