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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { listPlans, createPlan, updatePlan, deletePlan } from "@/lib/api/admin/orders"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/orders/plans")({
  beforeLoad: createAdminGuard({ requirePayment: true }),
  component: PlansPage,
})

type PlanRow = { id: number; name: string; price: number; status?: string }

function PlanForm({ defaultValues, onSubmit, onCancel, submitting, error }: { defaultValues?: { name: string; price: number }; onSubmit: (v: { name: string; price: number }) => void; onCancel: () => void; submitting?: boolean; error?: string | null }) {
  const { t } = useTranslation()
  const schema = z.object({ name: z.string().min(1, t("common.required") ?? "Required"), price: z.coerce.number().min(0) })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({ resolver: zodResolver(schema) as unknown as never, defaultValues: { name: defaultValues?.name ?? "", price: defaultValues?.price ?? 0 } })
  useEffect(() => { if (defaultValues) form.reset(defaultValues) }, [defaultValues, form])
  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="plan-name">{t("common.name")}</Label>
        <Input id="plan-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan-price">{t("admin.orders.price") ?? "Price"}</Label>
        <Input id="plan-price" type="number" step="0.01" {...form.register("price")} aria-invalid={!!form.formState.errors.price} />
        {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function PlansPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<PlanRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: queryKeys.admin.orders.plans(),
    queryFn: ({ signal }) => listPlans({ signal }),
  })

  const createMut = useMutation({
    mutationFn: (data: { name: string; price: number }) => createPlan(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.orders.plans() }); setCreateOpen(false); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; price: number } }) => updatePlan(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.orders.plans() }); setEditRow(null); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.orders.plans() }); setDeleteId(null); toast.success(t("common.deleted")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as unknown as PlanRow[] | { items?: PlanRow[] }
  const rows: PlanRow[] = Array.isArray(raw) ? raw : (raw as { items?: PlanRow[] })?.items ?? []
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.paymentPlans" action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>} />
        <div className="mt-6">
          <DataTable<PlanRow>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.name"), accessorKey: "name" },
              { header: t("admin.orders.price") ?? "Price", accessorKey: "price", align: "right" },
              { header: t("common.status"), cell: (r) => r.status ? <StatusBadge status={r.status === "active" ? "success" : "default"} label={r.status} /> : <span className="text-muted-foreground">-</span> },
              {
                header: t("common.actions"),
                align: "right",
                cell: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setEditRow(r) }}>{t("common.edit")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>{t("common.delete")}</Button>
                  </div>
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
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.create")}</DialogTitle></DialogHeader>
            <PlanForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) { setEditRow(null); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
            {editRow ? <PlanForm defaultValues={{ name: editRow.name, price: editRow.price }} onSubmit={(v) => { setFormError(null); updateMut.mutate({ id: editRow.id, data: v }) }} onCancel={() => setEditRow(null)} submitting={updateMut.isPending} error={formError} /> : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={deleteRow ? `Delete ${deleteRow.name} (ID ${deleteRow.id})? This cannot be undone.` : t("common.confirmDelete") ?? "Delete?"}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}
