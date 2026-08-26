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
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { listOrders } from "@/lib/api/admin/orders"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"

export const Route = createFileRoute("/admin/orders/")({
  beforeLoad: createAdminGuard({ requirePayment: true }),
  component: OrdersPage,
})

function OrdersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debounced = useDebouncedValue(search, 300)
  useEffect(() => setPage(1), [debounced])
  const query = useQuery({
    queryKey: queryKeys.admin.orders.list({ page, search: debounced }),
    queryFn: ({ signal }) => listOrders({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })
  type OrderRow = { id: string | number; amount: number; status: string; user?: string; created_at?: string }
  const raw = query.data as { items?: OrderRow[]; total?: number } | undefined
  const rows: OrderRow[] = raw?.items ?? []
  const total = raw?.total ?? rows.length
  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.orderManagement" />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable<OrderRow>
            columns={[
              { header: t("admin.orders.orderId") ?? "Order ID", accessorKey: "id" },
              { header: t("admin.orders.user") ?? "User", accessorKey: "user" },
              { header: t("admin.orders.amount") ?? "Amount", accessorKey: "amount", align: "right" },
              { header: t("common.status"), cell: (r) => <StatusBadge status={r.status === "paid" ? "success" : r.status === "pending" ? "warning" : "default"} label={r.status ?? "-"} /> },
              { header: t("common.createdAt") ?? "Created", accessorKey: "created_at" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => String(r.id)}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
