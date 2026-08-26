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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { queryKeys } from "@/lib/query/keys"
import { announcementsAPI } from "@/lib/api/admin/announcements"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/announcements")({
  beforeLoad: createAdminGuard(),
  component: AnnouncementsPage,
})

function AnnouncementForm({
  defaultTitle,
  defaultContent,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  defaultTitle?: string
  defaultContent?: string
  onSubmit: (v: { title: string; content: string }) => void
  onCancel: () => void
  submitting?: boolean
  error?: string | null
}) {
  const { t } = useTranslation()
  const schema = z.object({
    title: z.string().min(1, t("common.required") ?? "Required"),
    content: z.string().min(1, t("common.required") ?? "Required"),
  })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: defaultTitle ?? "", content: defaultContent ?? "" },
  })
  useEffect(() => { if (defaultTitle !== undefined || defaultContent !== undefined) form.reset({ title: defaultTitle ?? "", content: defaultContent ?? "" }) }, [defaultTitle, defaultContent, form])
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="ann-title">{t("common.title")}</Label>
        <Input id="ann-title" {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
        {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="ann-content">{t("common.content")}</Label>
        <Input id="ann-content" {...form.register("content")} aria-invalid={!!form.formState.errors.content} />
        {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

type AnnRow = { id: number; title: string; content?: string; status?: string }

function AnnouncementsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<AnnRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: queryKeys.admin.announcements.list({ search: debounced }),
    queryFn: ({ signal }) => announcementsAPI.list(1, 20, { search: debounced || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: async (data: { title: string; content: string }) => announcementsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.announcements.all() })
      setCreateOpen(false); setFormError(null); toast.success(t("common.saved"))
    },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => announcementsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.announcements.all() })
      setDeleteId(null); toast.success(t("common.deleted"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: AnnRow[]; total?: number } | undefined
  const rows: AnnRow[] = raw?.items ?? (Array.isArray(query.data) ? (query.data as AnnRow[]) : [])
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  const updateMut = useMutation({
    mutationFn: async (data: { id: number; title: string; content: string }) => announcementsAPI.update(data.id, { title: data.title, content: data.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.announcements.all() })
      setEditRow(null); setFormError(null); toast.success(t("common.saved"))
    },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader
          titleKey="admin.announcements.title"
          action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create")}</Button>}
        />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh")}</Button>
          </div>
          <DataTable<AnnRow>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.title"), accessorKey: "title" },
              { header: t("common.status"), accessorKey: "status" },
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
            <AnnouncementForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} error={formError} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) { setEditRow(null); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
            {editRow ? <AnnouncementForm defaultTitle={editRow.title} defaultContent={editRow.content ?? ""} onSubmit={(v) => { setFormError(null); updateMut.mutate({ id: editRow.id, ...v }) }} onCancel={() => setEditRow(null)} submitting={updateMut.isPending} error={formError} /> : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={deleteRow ? `Delete "${deleteRow.title}" (ID ${deleteRow.id})? This cannot be undone.` : t("common.confirmDelete") ?? "Delete this item? This cannot be undone."}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}
