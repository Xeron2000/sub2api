import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import type { SubmitHandler } from "react-hook-form"
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
import { proxiesAPI } from "@/lib/api/admin/proxies"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

type ProxyFormValues = { name: string; host: string; port: number }

export const Route = createFileRoute("/admin/proxies")({
  beforeLoad: createAdminGuard(),
  component: ProxiesPage,
})

function ProxyForm({ onSubmit, onCancel, submitting, error }: { onSubmit: SubmitHandler<ProxyFormValues>; onCancel: () => void; submitting?: boolean; error?: string | null }) {
  const { t } = useTranslation()
  const schema = z.object({ name: z.string().min(1, t("common.required") ?? "Required"), host: z.string().min(1), port: z.coerce.number().int().min(1).max(65535) })
  // @ts-ignore zodResolver coerce
  const form = useForm<ProxyFormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", host: "", port: 8080 } })
  return (
    // @ts-ignore - handleSubmit generic
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="proxy-name">{t("common.name")}</Label>
        <Input id="proxy-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="proxy-host">{t("admin.proxies.host") ?? "Host"}</Label>
        <Input id="proxy-host" {...form.register("host")} aria-invalid={!!form.formState.errors.host} />
        {form.formState.errors.host && <p className="text-sm text-destructive">{form.formState.errors.host.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="proxy-port">{t("admin.proxies.port") ?? "Port"}</Label>
        <Input id="proxy-port" type="number" {...form.register("port")} aria-invalid={!!form.formState.errors.port} />
        {form.formState.errors.port && <p className="text-sm text-destructive">{form.formState.errors.port.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function ProxiesPage() {
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
    queryKey: queryKeys.admin.proxies.list({ page, search: debounced }),
    queryFn: ({ signal }) => proxiesAPI.list(1, 20, { search: debounced || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: (data: { name: string; host: string; port: number }) => proxiesAPI.create({ name: data.name, host: data.host, port: data.port, protocol: "http" } as never),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.proxies.all() }); setCreateOpen(false); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => proxiesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.admin.proxies.all() }); setDeleteId(null); toast.success(t("common.deleted")) },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: Array<Record<string, unknown>>; total?: number } | Array<Record<string, unknown>> | undefined
  const rows = Array.isArray(raw) ? raw : (raw?.items ?? [])
  const total = Array.isArray(raw) ? rows.length : (raw?.total ?? rows.length)

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.proxies.title" action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>} />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.name"), accessorKey: "name" },
              { header: t("admin.proxies.host") ?? "Host", accessorKey: "host" },
              { header: t("admin.proxies.port") ?? "Port", accessorKey: "port", align: "right" },
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
          <p className="text-xs text-muted-foreground">{t("admin.proxies.passwordMasked") ?? "Password fields are never echoed in list view."}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.create")}</DialogTitle></DialogHeader>
            <ProxyForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={t("common.confirmDelete") ?? "Delete this item? This cannot be undone."}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}