import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/audit-logs")({ component: AuditLogsPage })

function AuditLogsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const pageSize = 10

  const query = useQuery({
    queryKey: ["admin", "audit-logs", { page, search }],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/audit-logs", { params: { page, page_size: pageSize, search: search || undefined } })
      const d = data as { items?: Array<{ id: number; action: string; user: string; created_at: string }>; total?: number }
      return { items: d.items ?? [], total: d.total ?? 0 }
    },
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.audit.title" />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
            <Button variant="outline" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Action", accessorKey: "action" },
              { header: "User", accessorKey: "user" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load audit logs" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No audit logs"
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
