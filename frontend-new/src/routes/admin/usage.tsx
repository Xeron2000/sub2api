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
import { listUsage } from "@/lib/api/admin/usage"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"

export const Route = createFileRoute("/admin/usage")({
  beforeLoad: createAdminGuard(),
  component: AdminUsagePage,
})

function AdminUsagePage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debounced = useDebouncedValue(search, 300)

  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.usage.list({ page, page_size: pageSize, search: debounced }),
    queryFn: ({ signal }) => listUsage({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const raw = query.data as { items?: Array<Record<string, unknown>>; total?: number } | undefined
  const rows = (raw?.items ?? []) as Array<{ id: number; user: string; model: string; tokens: number }>
  const total = raw?.total ?? rows.length

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.usage.title" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t("common.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              aria-label={t("common.search")}
            />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("admin.usage.user") ?? "User", accessorKey: "user" },
              { header: t("admin.usage.model") ?? "Model", accessorKey: "model" },
              { header: t("admin.usage.tokens") ?? "Tokens", accessorKey: "tokens", align: "right" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => r.id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
