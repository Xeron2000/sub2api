import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatMoney, formatDateTime } from "@/lib/format"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/orders")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/orders" } as Record<string, string> })
    }
  },
  component: OrdersPage,
})

function orderStatusVariant(status: string): "success" | "warning" | "error" | "default" {
  if (status === "paid" || status === "completed" || status === "success") return "success"
  if (status === "pending" || status === "processing") return "warning"
  if (status === "failed" || status === "cancelled" || status === "refunded") return "error"
  return "default"
}

function OrdersPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: async ({ signal }) => {
      const { data } = await paymentAPI.getMyOrders({}, { signal })
      const d = data as { items?: Array<{ id: string; status: string; amount: number; created_at: string }> }
      const items = d.items ?? (Array.isArray(data) ? (data as Array<{ id: string; status: string; amount: number; created_at: string }>) : [])
      return items
    },
  })

  if (query.isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <PageHeader titleKey="nav.myOrders" />
          <div className="mt-6">
            <LoadingState />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  if (query.isError) {
    return (
      <AppShell>
        <PageContainer>
          <PageHeader titleKey="nav.myOrders" />
          <div className="mt-6">
            <ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  const rows = query.data ?? []

  if (rows.length === 0) {
    return (
      <AppShell>
        <PageContainer>
          <PageHeader titleKey="nav.myOrders" />
          <div className="mt-6">
            <EmptyState
              title={t("orders.emptyTitle") || "No orders yet"}
              description={t("orders.emptyDesc") || "Your orders will appear here after purchase."}
            />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="nav.myOrders" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: t("orders.orderId") || "Order ID", accessorKey: "id" },
              {
                header: t("orders.status") || "Status",
                accessorKey: "status",
                cell: (r) => {
                  const s = String((r as { status: string }).status)
                  return <StatusBadge status={orderStatusVariant(s)} label={s} />
                },
              },
              {
                header: t("orders.amount") || "Amount",
                accessorKey: "amount",
                align: "right",
                cell: (r) => formatMoney((r as { amount: number }).amount),
              },
              {
                header: t("orders.date") || "Date",
                accessorKey: "created_at",
                cell: (r) => formatDateTime((r as { created_at: string }).created_at),
              },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={false}
            error={null}
            onRetry={() => query.refetch()}
            getRowId={(r) => String((r as { id: string }).id)}
          />
        </div>
      </PageContainer>
    </AppShell>
  )
}
