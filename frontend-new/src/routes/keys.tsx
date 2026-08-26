import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CopyButton } from "@/components/shared/CopyButton"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { queryKeys } from "@/lib/query/keys"
import { listKeys, createKey, updateKey, deleteKey  } from "@/lib/api/keys"
import type {ApiKey} from "@/lib/api/keys";
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useTranslation } from "@/i18n"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/keys")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("auth_token")) {
      throw redirect({ to: "/login", search: { redirect: "/keys" } })
    }
  },
  component: KeysPage,
})

function ApiKeyForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  defaultValues?: { name: string }
  onSubmit: (v: { name: string }) => void
  onCancel: () => void
  submitting?: boolean
  error?: string | null
}) {
  const { t } = useTranslation()
  const schema = z.object({ name: z.string().min(1, t("common.name") + " required").max(64) })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValues?.name ?? "" },
  })
  useEffect(() => {
    if (defaultValues) form.reset({ name: defaultValues.name })
  }, [defaultValues, form])
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="key-name">{t("common.name")}</Label>
        <Input id="key-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function KeysPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<ApiKey | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const query = useQuery({
    queryKey: queryKeys.keys.list({ page, search: debouncedSearch }),
    queryFn: ({ signal }) => listKeys({ page, page_size: pageSize, search: debouncedSearch || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: (payload: { name: string }) => createKey(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.keys.all() })
      setCreateOpen(false)
      setFormError(null)
      toast.success(t("common.saved"))
    },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateKey(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.keys.all() })
      setEditRow(null)
      setFormError(null)
      toast.success(t("common.saved"))
    },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const delMut = useMutation({
    mutationFn: (id: number) => deleteKey(id),
    onSuccess: () => {
      const total = (query.data?.total ?? 0) - 1
      const pages = Math.max(1, Math.ceil(total / pageSize))
      if (page > pages) setPage(pages)
      qc.invalidateQueries({ queryKey: queryKeys.keys.all() })
      setDeleteId(null)
      toast.success(t("common.deleted"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const rows: ApiKey[] = (query.data?.items) ?? []
  const total: number = query.data?.total ?? rows.length
  const isLoading = query.isLoading
  const errorMsg = query.error ? getAppErrorMessage(query.error) : null
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={t("keys.title") !== "keys.title" ? t("keys.title") : "API Keys"}
          description={t("keys.description") !== "keys.description" ? t("keys.description") : undefined}
          action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>}
        />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <div className="ml-auto"><Button variant="outline" onClick={() => query.refetch()}>{t("common.refresh")}</Button></div>
          </div>

          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.name"), accessorKey: "name" },
              { header: t("common.status"), cell: (r: unknown) => {
                const row = r as ApiKey
                return <StatusBadge status={row.status === "active" ? "success" : row.status === "inactive" ? "warning" : "default"} label={String(row.status)} />
              } },
              { header: "Key", cell: (r: unknown) => {
                const row = r as ApiKey
                return row.key ? <CopyButton value={String(row.key)} label={t("common.copy")} /> : <span className="text-muted-foreground">-</span>
              } },
              { header: t("common.created") !== "common.created" ? t("common.created") : "Created", accessorKey: "created_at" },
              {
                header: t("common.actions"),
                align: "right",
                cell: (r: unknown) => {
                  const row = r as ApiKey
                  return (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setEditRow(row) }}>{t("common.edit")}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>{t("common.delete")}</Button>
                    </div>
                  )
                },
              },
            ]}
            data={rows}
            loading={isLoading}
            error={errorMsg}
            onRetry={() => query.refetch()}
            emptyTitle={t("keys.emptyTitle") !== "keys.emptyTitle" ? t("keys.emptyTitle") : "No API keys yet"}
            emptyAction={<Button onClick={() => setCreateOpen(true)}>{t("common.create")}</Button>}
            getRowId={(r: unknown) => (r as ApiKey).id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setFormError(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.create")}</DialogTitle></DialogHeader>
            <ApiKeyForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) { setEditRow(null); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
            {editRow ? <ApiKeyForm defaultValues={{ name: editRow.name }} onSubmit={(v) => { setFormError(null); updateMut.mutate({ id: editRow.id, name: v.name }) }} onCancel={() => setEditRow(null)} submitting={updateMut.isPending} error={formError} /> : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("keys.deleteConfirmTitle") !== "keys.deleteConfirmTitle" ? t("keys.deleteConfirmTitle") : "Delete API key"}
          description={deleteRow ? `Delete "${deleteRow.name}" (ID ${deleteRow.id})? This cannot be undone.` : "Delete this key? This cannot be undone."}
          onConfirm={() => { if (deleteId != null) delMut.mutate(deleteId) }}
          loading={delMut.isPending}
        />
      </PageContainer>
    </AppShell>
  )
}
