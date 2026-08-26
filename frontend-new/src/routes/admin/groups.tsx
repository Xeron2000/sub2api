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
import { listGroups } from "@/lib/api/admin/groups"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { StatusBadge } from "@/components/shared/StatusBadge"

export const Route = createFileRoute("/admin/groups")({
  beforeLoad: createAdminGuard({ blockSimpleMode: true }),
  component: GroupsPage,
})

type GroupRow = { id: number; name: string; rate_multiplier: number; profit_control_enabled: boolean; status: string }

function GroupsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const pageSize = 10
  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.groups.list({ page, search: debounced }),
    queryFn: ({ signal }) => listGroups({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const raw = query.data as { items?: GroupRow[]; total?: number } | undefined
  const rows: GroupRow[] = raw?.items ?? []
  const total = raw?.total ?? rows.length

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.groups.title" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable<GroupRow>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.name"), accessorKey: "name" },
              { header: t("admin.groups.rate") ?? "Rate", accessorKey: "rate_multiplier", align: "right" },
              { header: t("admin.groups.profit") ?? "Profit", cell: (r) => <StatusBadge status={r.profit_control_enabled ? "success" : "default"} label={r.profit_control_enabled ? t("common.enabled") : t("common.disabled")} /> },
              { header: t("common.status"), cell: (r) => (r.status ? <StatusBadge status="default" label={r.status} /> : <span className="text-muted-foreground">-</span>) },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => r.id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          <p className="text-xs text-muted-foreground">{t("admin.groups.parityHint") ?? "Full group editor (tabs for pricing/profit/reasoning) covered in docs/admin-groups-parity.md — detailed editor follows parity sequencing."}</p>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
