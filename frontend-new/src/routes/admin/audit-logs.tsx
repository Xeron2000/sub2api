import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query/keys"
import { listAuditLogs } from "@/lib/api/admin/audit"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { formatDateTime } from "@/lib/format"
import { StatusBadge } from "@/components/shared/StatusBadge"

export const Route = createFileRoute("/admin/audit-logs")({
  beforeLoad: createAdminGuard(),
  component: AuditLogsPage,
})

function AuditLogsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const pageSize = 10

  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.audit.list({ page, search: debounced }),
    queryFn: ({ signal }) => listAuditLogs({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const raw = query.data as { items?: Array<Record<string, unknown>>; total?: number } | undefined
  const rows = (raw?.items ?? []) as Array<{ id: number; action: string; actor_email: string; created_at: string; client_ip: string; status_code: number }>
  const total = raw?.total ?? rows.length

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.audit.title" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t("common.searchPlaceholder") as string}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              aria-label={t("common.search") as string}
            />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset") as string}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh") as string}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: (t("admin.audit.action") as string) || "Action", accessorKey: "action", cell: (r) => <StatusBadge status="default" label={String(r.action ?? "-")} /> },
              { header: (t("admin.audit.actor") as string) || "Actor", accessorKey: "actor_email" },
              { header: (t("admin.audit.ip") as string) || "IP", accessorKey: "client_ip" },
              { header: (t("admin.audit.status") as string) || "Status", accessorKey: "status_code", align: "right", cell: (r) => <StatusBadge status={Number(r.status_code) >= 400 ? "warning" : "success"} label={String(r.status_code ?? "-")} /> },
              { header: (t("admin.audit.time") as string) || "Time", accessorKey: "created_at", cell: (r) => formatDateTime(String(r.created_at ?? "")) },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData") as string}
            getRowId={(r) => r.id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
