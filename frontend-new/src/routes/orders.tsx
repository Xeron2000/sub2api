import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/orders")({ component: OrdersPage })

function OrdersPage() {
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await paymentAPI.getMyOrders()
      const d = data as unknown as { items?: Array<{ id: string; status: string; amount: number; created_at: string }> }
      return (d.items ?? (data))
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="nav.myOrders" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "Order ID", accessorKey: "id" },
              { header: "Status", accessorKey: "status" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={(query.data) ?? []}
            loading={query.isLoading}
            error={query.isError ? "Failed to load orders" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No orders"
          />
        </div>
      </PageContainer>
    </AppShell>
  )
}
