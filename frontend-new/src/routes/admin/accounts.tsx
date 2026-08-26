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
import { accountsAPI } from "@/lib/api/admin/accounts"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"

export const Route = createFileRoute("/admin/accounts")({
  beforeLoad: createAdminGuard(),
  component: AccountsPage,
})

function AccountsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debounced = useDebouncedValue(search, 300)
  useEffect(() => setPage(1), [debounced])
  const query = useQuery({
    queryKey: queryKeys.admin.accounts.list({ page, search: debounced }),
    queryFn: ({ signal }) => accountsAPI.list({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })
  const raw = query.data as { data?: { items?: Array<Record<string, unknown>>; total?: number }; items?: Array<Record<string, unknown>>; total?: number } | { items?: Array<Record<string, unknown>>; total?: number } | undefined
  // accountsAPI.list returns axios response; handle both shapes
  const payload = (raw as { data?: unknown })?.data ? (raw as { data: { items?: Array<Record<string, unknown>>; total?: number } }).data : raw
  const rows = ((payload as { items?: Array<Record<string, unknown>> })?.items ?? []) as Array<Record<string, unknown>>
  const total = (payload as { total?: number })?.total ?? rows.length
  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.accounts.title" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.email") ?? "Email", accessorKey: "email" },
              { header: t("common.status"), accessorKey: "status" },
              { header: t("admin.accounts.provider") ?? "Provider", accessorKey: "provider" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => (r as { id: number }).id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          <p className="text-xs text-muted-foreground">{t("admin.accounts.parityNote") ?? "Credential fields are masked by default; detailed CRUD, batch actions and test flows are tracked in the parity inventory. No secrets are logged."}</p>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
