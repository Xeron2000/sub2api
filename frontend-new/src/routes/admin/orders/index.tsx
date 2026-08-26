import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { adminPaymentAPI } from "@/lib/api/admin/payment"

export const Route = createFileRoute("/admin/orders/")({ component: OrdersPage })

function OrdersPage() {
  const query = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await adminPaymentAPI.getOrders()
      const d = data as unknown as { items?: Array<{ id: string; amount: number; status: string }> }
      return d.items ?? (data as unknown as Array<{ id: string; amount: number; status: string }>)
    },
  })

  const rows = (query.data as Array<{ id: string; amount: number; status: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.orderManagement" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "Order ID", accessorKey: "id" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "Status", accessorKey: "status" },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load orders" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No orders"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
