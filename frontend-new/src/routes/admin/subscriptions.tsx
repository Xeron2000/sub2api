import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { subscriptionsAPI } from "@/lib/api/admin/subscriptions"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/subscriptions")({
  beforeLoad: createAdminGuard({ blockSimpleMode: true }),
  component: AdminSubscriptionsPage,
})

type SubRow = { id: number; user: string; group: string; status: string }

function AdminSubscriptionsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const pageSize = 10
  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.subscriptions.list({ page, search: debounced }),
    queryFn: ({ signal }) => subscriptionsAPI.list({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const extendMut = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) => subscriptionsAPI.extend(id, { validity_days: days }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.subscriptions.all() }); toast.success(t("common.saved")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })
  const revokeMut = useMutation({
    mutationFn: (id: number) => subscriptionsAPI.revoke(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.subscriptions.all() }); toast.success(t("common.saved")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })
  const restoreMut = useMutation({
    mutationFn: (id: number) => subscriptionsAPI.restore(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.subscriptions.all() }); toast.success(t("common.saved")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })
  const resetQuotaMut = useMutation({
    mutationFn: (id: number) => subscriptionsAPI.resetQuota(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.subscriptions.all() }); toast.success(t("common.saved")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: SubRow[]; total?: number } | undefined
  const rows: SubRow[] = raw?.items ?? []
  const total = raw?.total ?? rows.length

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.subscriptions.title" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable<SubRow>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("admin.subscriptions.user") ?? "User", accessorKey: "user" },
              { header: t("admin.subscriptions.group") ?? "Group", accessorKey: "group" },
              { header: t("common.status"), cell: (r) => <StatusBadge status={r.status === "active" ? "success" : r.status === "expired" ? "warning" : "default"} label={r.status} /> },
              {
                header: t("common.actions"),
                align: "right",
                cell: (row) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 hover:bg-accent">
                      {t("common.actions")}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => extendMut.mutate({ id: row.id, days: 7 })}>{t("admin.subscriptions.extend") ?? "Extend 7d"}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => revokeMut.mutate(row.id)}>{t("admin.subscriptions.revoke") ?? "Revoke"}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => restoreMut.mutate(row.id)}>{t("admin.subscriptions.restore") ?? "Restore"}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => resetQuotaMut.mutate(row.id)}>{t("admin.subscriptions.resetQuota") ?? "Reset Quota"}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
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
