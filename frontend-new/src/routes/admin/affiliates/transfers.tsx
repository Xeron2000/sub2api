import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/affiliates/transfers")({ component: TransfersPage })

function TransfersPage() {
  const query = useQuery({
    queryKey: ["admin", "affiliates", "transfers"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/affiliates/transfers")
      const d = data as { items?: Array<{ id: number; amount: number; created_at: string }> }
      return d.items ?? (data as Array<{ id: number; amount: number; created_at: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; amount: number; created_at: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.affiliateTransferRecords" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load transfers" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No transfers"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
