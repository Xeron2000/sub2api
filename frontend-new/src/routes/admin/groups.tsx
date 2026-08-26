import { createFileRoute, redirect } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/groups")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("auth_user") || "null")
        if (user?.is_simple_mode) throw redirect({ to: "/admin/dashboard" })
      } catch (e) {
        if ((e as { message?: string })?.message?.includes("redirect")) throw e
      }
    }
  },
  component: GroupsPage,
})

function GroupsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const pageSize = 10

  const query = useQuery({
    queryKey: ["admin", "groups", { page, search }],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/groups", { params: { page, page_size: pageSize, search: search || undefined } })
      const d = data as { items?: Array<{ id: number; name: string; rate_multiplier: number; profit_control_enabled: boolean }>; total?: number }
      return { items: d.items ?? [], total: d.total ?? 0 }
    },
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.groups.title" />
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
              { header: "Name", accessorKey: "name" },
              { header: "Rate", accessorKey: "rate_multiplier", align: "right" },
              { header: "Profit", cell: (r: { profit_control_enabled: boolean }) => (r.profit_control_enabled ? "Enabled" : "Disabled") },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load groups" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No groups"
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
