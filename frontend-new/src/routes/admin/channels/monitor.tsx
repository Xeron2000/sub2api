import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { queryKeys } from "@/lib/query/keys"
import { listChannelMonitors } from "@/lib/api/admin/channelMonitor"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"

export const Route = createFileRoute("/admin/channels/monitor")({
  beforeLoad: createAdminGuard(),
  component: ChannelMonitorPage,
})

function ChannelMonitorPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.admin.channels.monitor({}),
    queryFn: ({ signal }) => listChannelMonitors({}, { signal }),
  })
  const raw = query.data as { items?: Array<Record<string, unknown>> } | undefined
  const rows = (raw?.items ?? []) as Array<Record<string, unknown>>
  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.channelMonitor.title" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("admin.channelMonitor.channel") ?? "Channel", accessorKey: "name" },
              { header: t("admin.channelMonitor.status") ?? "Status", accessorKey: "status" },
              { header: t("admin.channelMonitor.latency") ?? "Latency", accessorKey: "latency", align: "right" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => (r as { id: number }).id}
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
