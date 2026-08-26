import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { redeemAPI } from "@/lib/api/admin/redeem"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/redeem")({
  beforeLoad: createAdminGuard({ blockSimpleMode: true }),
  component: RedeemPage,
})

function RedeemForm({
  onSubmit, onCancel, submitting, error,
}: { onSubmit: (v: { count: number; value: number }) => void; onCancel: () => void; submitting?: boolean; error?: string | null }) {
  const { t } = useTranslation()
  const schema = z.object({
    count: z.coerce.number().int().min(1).max(100),
    value: z.coerce.number().min(0),
  })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({ resolver: zodResolver(schema) as unknown as never, defaultValues: { count: 1, value: 10 } })
  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="redeem-count">{t("admin.redeem.count") ?? "Count"}</Label>
        <Input id="redeem-count" type="number" {...form.register("count")} aria-invalid={!!form.formState.errors.count} />
        {form.formState.errors.count && <p className="text-sm text-destructive">{form.formState.errors.count.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="redeem-value">{t("admin.redeem.value") ?? "Value"}</Label>
        <Input id="redeem-value" type="number" {...form.register("value")} aria-invalid={!!form.formState.errors.value} />
        {form.formState.errors.value && <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function RedeemPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debounced = useDebouncedValue(search, 300)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.redeem.list({ page, search: debounced }),
    queryFn: ({ signal }) => redeemAPI.list({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: (data: { count: number; value: number }) => redeemAPI.generate({ count: data.count, quota: data.value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.redeem.all() }); setCreateOpen(false); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => redeemAPI.delete(id),
    onSuccess: () => {
      const total = ((query.data as { total?: number })?.total ?? 0) - 1
      const pages = Math.max(1, Math.ceil(total / pageSize))
      if (page > pages) setPage(pages)
      qc.invalidateQueries({ queryKey: queryKeys.admin.redeem.all() })
      setDeleteId(null); toast.success(t("common.deleted"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: Array<Record<string, unknown>>; total?: number } | undefined
  const rows = (raw?.items ?? []) as Array<{ id: number; code: string; quota: number; status: string; used: boolean }>
  const total = raw?.total ?? rows.length
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.redeem.title" action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>} />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("admin.redeem.code") ?? "Code", accessorKey: "code" },
              { header: t("admin.redeem.quota") ?? "Quota", accessorKey: "quota", align: "right" },
              { header: t("common.status"), cell: (r: Record<string, unknown>) => <StatusBadge status={(r as { used: boolean }).used ? "warning" : "success"} label={(r as { status: string }).status ?? ((r as { used: boolean }).used ? "used" : "unused")} /> },
              {
                header: t("common.actions"),
                align: "right",
                cell: (r: Record<string, unknown>) => <Button variant="ghost" size="sm" onClick={() => setDeleteId((r as { id: number }).id)}>{t("common.delete")}</Button>,
              },
            ]}
            data={rows as Array<Record<string, unknown>>}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r: Record<string, unknown>) => (r as { id: number }).id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.create")}</DialogTitle></DialogHeader>
            <RedeemForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={deleteRow ? `Delete ${deleteRow.code} (ID ${deleteRow.id})? This cannot be undone.` : t("common.confirmDelete") ?? "Delete this item?"}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}
