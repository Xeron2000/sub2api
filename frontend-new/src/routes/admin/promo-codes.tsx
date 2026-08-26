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
import { queryKeys } from "@/lib/query/keys"
import { promoAPI } from "@/lib/api/admin/promo"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/promo-codes")({
  beforeLoad: createAdminGuard(),
  component: PromoCodesPage,
})

function PromoForm({
  onSubmit, onCancel, submitting, error,
}: { onSubmit: (v: { code: string; discount: number }) => void; onCancel: () => void; submitting?: boolean; error?: string | null }) {
  const { t } = useTranslation()
  const schema = z.object({
    code: z.string().min(1, t("common.required") ?? "Required"),
    discount: z.coerce.number().min(0).max(100),
  })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({ resolver: zodResolver(schema) as unknown as never, defaultValues: { code: "", discount: 10 } })
  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="promo-code">{t("admin.promo.code") ?? "Code"}</Label>
        <Input id="promo-code" {...form.register("code")} aria-invalid={!!form.formState.errors.code} />
        {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="promo-discount">{t("admin.promo.discount") ?? "Discount"} (%)</Label>
        <Input id="promo-discount" type="number" {...form.register("discount")} aria-invalid={!!form.formState.errors.discount} />
        {form.formState.errors.discount && <p className="text-sm text-destructive">{form.formState.errors.discount.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function PromoCodesPage() {
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
    queryKey: queryKeys.admin.promo.list({ page, search: debounced }),
    queryFn: ({ signal }) => promoAPI.list({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: (data: { code: string; discount: number }) => promoAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.promo.all() }); setCreateOpen(false); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => promoAPI.delete(id),
    onSuccess: () => {
      const total = ((query.data as { total?: number })?.total ?? 0) - 1
      const pages = Math.max(1, Math.ceil(total / pageSize))
      if (page > pages) setPage(pages)
      qc.invalidateQueries({ queryKey: queryKeys.admin.promo.all() })
      setDeleteId(null); toast.success(t("common.deleted"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: Array<Record<string, unknown>>; total?: number } | undefined
  const rows = (raw?.items ?? []) as Array<{ id: number; code: string; discount: string }>
  const total = raw?.total ?? rows.length
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.promo.title" action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>} />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("admin.promo.code") ?? "Code", accessorKey: "code" },
              { header: t("admin.promo.discount") ?? "Discount", accessorKey: "discount" },
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
            <PromoForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={deleteRow ? `Delete ${deleteRow.code} (ID ${deleteRow.id})? This cannot be undone.` : t("common.confirmDelete") ?? "Delete?"}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}
