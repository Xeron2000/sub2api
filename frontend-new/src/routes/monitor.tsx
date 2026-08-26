import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/monitor")({ component: MonitorPage })

function MonitorPage() {
  const query = useQuery({
    queryKey: ["channelMonitor", "status"],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get("/monitor/status", { signal })
      return data as { channels: Array<{ id: number; name: string; status: string; latency: number }> }
    },
  })

  const rows = query.data?.channels ?? []

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="nav.channelStatus" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "Channel", accessorKey: "name" },
              { header: "Status", accessorKey: "status" },
              { header: "Latency (ms)", accessorKey: "latency", align: "right" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No channels"
          />
        </div>
      </PageContainer>
    </AppShell>
  )
}
