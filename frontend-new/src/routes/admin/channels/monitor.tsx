import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/channels/monitor")({ component: MonitorPage })

function MonitorPage() {
  const query = useQuery({
    queryKey: ["admin", "channels", "monitor"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/channel-monitors")
      const d = data as { items?: Array<{ id: number; name: string; status: string }> }
      return d.items ?? (data as Array<{ id: number; name: string; status: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; name: string; status: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.channelMonitor.title" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Name", accessorKey: "name" },
              { header: "Status", accessorKey: "status" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load monitors" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No monitors"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
