import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { queryKeys } from "@/lib/query/keys"
import { listUsers, updateUser, deleteUser } from "@/lib/api/users"
import type { AdminUser } from "@/lib/api/users"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { getAppErrorMessage } from "@/lib/api/errors"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/users")({
  beforeLoad: createAdminGuard(),
  component: AdminUsersPage,
})

function UserForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  defaultValues?: { email: string }
  onSubmit: (v: { email: string }) => void
  onCancel: () => void
  submitting?: boolean
  error?: string | null
}) {
  const { t } = useTranslation()
  const schema = z.object({ email: z.string().email(t("common.invalidEmail")) })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: defaultValues?.email ?? "" } })
  useEffect(() => { if (defaultValues) form.reset({ email: defaultValues.email }) }, [defaultValues, form])
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="user-email">{t("common.email")}</Label>
        <Input id="user-email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? t("common.saving") : t("common.confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function AdminUsersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const pageSize = 10
  const [editRow, setEditRow] = useState<AdminUser | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.users.list({ page, search: debounced }),
    queryFn: ({ signal }) => listUsers({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => updateUser(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.users.all() }); setEditRow(null); setFormError(null); toast.success(t("common.saved")) },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      const total = (query.data?.total ?? 0) - 1
      const pages = Math.max(1, Math.ceil(total / pageSize))
      if (page > pages) setPage(pages)
      qc.invalidateQueries({ queryKey: queryKeys.users.all() })
      setDeleteId(null)
      toast.success(t("common.deleted"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const rows: AdminUser[] = (query.data?.items) ?? []
  const total = query.data?.total ?? rows.length
  const errorMsg = query.error ? getAppErrorMessage(query.error) : null
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  return (
    <AppShell>
      <PageContainer>
        <PageHeader title={t("admin.users.title") !== "admin.users.title" ? t("admin.users.title") : "Users"} />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search")} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset")}</Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => query.refetch()}>{t("common.refresh")}</Button>
              <Button onClick={() => toast.info("Create user: backend support pending")}>{t("common.create")}</Button>
            </div>
          </div>

          <DataTable<AdminUser>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.email"), accessorKey: "email" },
              { header: t("common.role") !== "common.role" ? t("common.role") : "Role", cell: (row) => <StatusBadge status={row.role === "admin" ? "info" : "default"} label={row.role} /> },
              { header: t("common.status"), cell: (row) => <StatusBadge status={row.status === "active" ? "success" : "warning"} label={row.status} /> },
              {
                header: t("common.actions"),
                align: "right",
                cell: (row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 hover:bg-accent hover:text-accent-foreground">{t("common.actions")}</DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setFormError(null); setEditRow(row) }}>{t("common.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMut.mutate({ id: row.id, payload: { status: row.status === "active" ? "inactive" : "active" } })}>{row.status === "active" ? t("common.disabled") : t("common.enabled")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(row.id)}>{t("common.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                },
            ]}
            data={rows}
            loading={query.isLoading}
            error={errorMsg}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData")}
            getRowId={(r) => r.id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>

        <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) { setEditRow(null); setFormError(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
            {editRow ? <UserForm defaultValues={{ email: editRow.email }} onSubmit={(v) => { setFormError(null); updateMut.mutate({ id: editRow.id, payload: { email: v.email } }) }} onCancel={() => setEditRow(null)} submitting={updateMut.isPending} error={formError} /> : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete")}
          description={deleteRow ? `Delete ${deleteRow.email} (ID ${deleteRow.id})? This cannot be undone.` : "Delete this user? This cannot be undone."}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AppShell>
  )
}
