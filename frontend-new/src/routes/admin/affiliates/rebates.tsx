import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/affiliates/rebates")({ component: RebatesPage })

function RebatesPage() {
  const query = useQuery({
    queryKey: ["admin", "affiliates", "rebates"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/affiliates/rebates")
      const d = data as { items?: Array<{ id: number; amount: number; created_at: string }> }
      return d.items ?? (data as Array<{ id: number; amount: number; created_at: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; amount: number; created_at: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.affiliateRebateRecords" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load rebates" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No rebates"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
