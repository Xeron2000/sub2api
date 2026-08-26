import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { queryKeys } from "@/lib/query/keys"
import { apiClient } from "@/lib/api/client"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/keys")({ component: KeysPage })

type KeyRow = { id: number; name: string; status: string; created_at: string }

function KeysPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const pageSize = 10

  const query = useQuery({
    queryKey: queryKeys.keys.list({ page, search }),
    queryFn: async () => {
      const { data } = await apiClient.get("/keys", { params: { page, page_size: pageSize, search: search || undefined } }).catch(() => ({ data: { items: [], total: 0 } }))
      return data as { items: KeyRow[]; total: number }
    },
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.keys.all() }),
  })

  const rows: KeyRow[] = (query.data as { items: KeyRow[] })?.items ?? []
  const total: number = (query.data as { total: number })?.total ?? rows.length

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="keys.title"
          descriptionKey="keys.description"
          action={<Button onClick={() => alert("Create flow - wire to POST /keys in next iteration")}>{t("keys.createKey")}</Button>}
        />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("keys.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
            <Button variant="ghost" onClick={() => { setSearch(""); setPage(1) }}>
              {t("common.reset")}
            </Button>
          </div>
          <DataTable
            columns={[
              { header: t("keys.id"), accessorKey: "id", align: "right" },
              { header: t("common.name"), accessorKey: "name" },
              { header: t("common.status"), cell: (r: KeyRow) => <StatusBadge status={r.status === "active" ? "success" : "default"} label={r.status} /> },
              { header: t("keys.created"), accessorKey: "created_at" },
              {
                header: t("common.actions"),
                align: "right",
                cell: (r: KeyRow) => (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
                    {t("common.delete")}
                  </Button>
                ),
              },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.error ? (query.error as { message?: string }).message ?? "Failed" : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("keys.noKeysYet")}
            emptyAction={<Button>{t("keys.createKey")}</Button>}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        titleKey="keys.deleteKey"
        descriptionKey="keys.deleteConfirmMessage"
        onConfirm={() => {
          if (deleteId !== null) delMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
        loading={delMut.isPending}
      />
    </AppShell>
  )
}
