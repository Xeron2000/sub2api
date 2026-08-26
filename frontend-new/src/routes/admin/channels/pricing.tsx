import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/channels/pricing")({ component: PricingPage })

function PricingPage() {
  const query = useQuery({
    queryKey: ["admin", "channels", "pricing"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/channels")
      const d = data as { items?: Array<{ id: number; name: string; platform: string }> }
      return d.items ?? (data as Array<{ id: number; name: string; platform: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; name: string; platform: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.channels.title" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Name", accessorKey: "name" },
              { header: "Platform", accessorKey: "platform" },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load channels" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No channels"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
