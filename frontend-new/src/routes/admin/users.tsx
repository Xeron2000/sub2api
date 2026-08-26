import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/users")({ component: AdminUsersPage })

type UserRow = { id: number; email: string; role: string; status: string }

function AdminUsersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const pageSize = 10

  const query = useQuery({
    queryKey: queryKeys.users.list({ page, search }),
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/users", { params: { page, page_size: pageSize, search: search || undefined } }).catch(() => ({ data: { items: [], total: 0 } }))
      return data as { items: UserRow[]; total: number }
    },
  })

  const rows: UserRow[] = (query.data as { items: UserRow[] })?.items ?? []
  const total: number = (query.data as { total: number })?.total ?? rows.length

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="admin.users.title" />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
            <Button variant="ghost" onClick={() => { setSearch(""); setPage(1) }}>
              Clear filters
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => query.refetch()}>
                Refresh
              </Button>
              <Button>{t("common.create")}</Button>
            </div>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Email", accessorKey: "email" },
              { header: "Role", cell: (r: UserRow) => <StatusBadge status={r.role === "admin" ? "info" : "default"} label={r.role} /> },
              { header: "Status", cell: (r: UserRow) => <StatusBadge status={r.status === "active" ? "success" : "warning"} label={r.status} /> },
              {
                header: "Actions",
                align: "right",
                cell: () => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Disable
                    </Button>
                  </div>
                ),
              },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.error ? (query.error as { message?: string }).message ?? "Failed" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No users"
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AppShell>
  )
}
