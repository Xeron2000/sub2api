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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { queryKeys } from "@/lib/query/keys"
import { groupsAPI } from "@/lib/api/admin/groups"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/groups")({
  beforeLoad: createAdminGuard({ blockSimpleMode: true }),
  component: GroupsPage,
})

type GroupRow = {
  id: number
  name: string
  description?: string
  rate_multiplier?: number | string
  profit_control_enabled?: boolean
  status?: string
  platform?: string
  supported_model_scopes?: string[]
  image_price_1k?: number
  image_price_2k?: number
  image_price_4k?: number
  video_price_480p?: number
  video_price_720p?: number
  video_price_1080p?: number
  max_reasoning_effort?: number
  allow_messages_dispatch?: boolean
  profit_min_margin_percent?: number
  profit_safety_buffer_percent?: number
}

type GroupFormData = {
  name: string
  description: string
  rate_multiplier: number
  platform: string
  supported_model_scopes: string
  image_price_1k: number | undefined
  image_price_2k: number | undefined
  image_price_4k: number | undefined
  video_price_480p: number | undefined
  video_price_720p: number | undefined
  video_price_1080p: number | undefined
  max_reasoning_effort: number | undefined
  allow_messages_dispatch: boolean
  profit_control_enabled: boolean
  profit_min_margin_percent: number | undefined
  profit_safety_buffer_percent: number | undefined
}

function buildSchema() {
  return z.object({
    name: z.string().min(1, "Required"),
    description: z.string().optional().default(""),
    rate_multiplier: z.coerce.number().finite().min(0),
    platform: z.string().optional().default("openai"),
    supported_model_scopes: z.string().optional().default(""),
    image_price_1k: z.coerce.number().min(0).optional(),
    image_price_2k: z.coerce.number().min(0).optional(),
    image_price_4k: z.coerce.number().min(0).optional(),
    video_price_480p: z.coerce.number().min(0).optional(),
    video_price_720p: z.coerce.number().min(0).optional(),
    video_price_1080p: z.coerce.number().min(0).optional(),
    max_reasoning_effort: z.coerce.number().int().min(0).optional(),
    allow_messages_dispatch: z.boolean().default(false),
    profit_control_enabled: z.boolean().default(false),
    profit_min_margin_percent: z.coerce.number().min(0).max(100).optional(),
    profit_safety_buffer_percent: z.coerce.number().min(0).max(100).optional(),
  })
}

function toPayload(v: GroupFormData): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: v.name.trim(),
    description: v.description?.trim() || undefined,
    rate_multiplier: v.rate_multiplier,
    platform: v.platform || "openai",
    supported_model_scopes: v.supported_model_scopes ? v.supported_model_scopes.split(",").map((s) => s.trim()).filter(Boolean) : [],
  }
  // preserve decimal precision: send as numbers but do not round; null vs undefined distinction
  if (v.image_price_1k !== undefined && !Number.isNaN(v.image_price_1k)) out.image_price_1k = v.image_price_1k
  if (v.image_price_2k !== undefined && !Number.isNaN(v.image_price_2k)) out.image_price_2k = v.image_price_2k
  if (v.image_price_4k !== undefined && !Number.isNaN(v.image_price_4k)) out.image_price_4k = v.image_price_4k
  if (v.video_price_480p !== undefined && !Number.isNaN(v.video_price_480p)) out.video_price_480p = v.video_price_480p
  if (v.video_price_720p !== undefined && !Number.isNaN(v.video_price_720p)) out.video_price_720p = v.video_price_720p
  if (v.video_price_1080p !== undefined && !Number.isNaN(v.video_price_1080p)) out.video_price_1080p = v.video_price_1080p
  if (v.max_reasoning_effort !== undefined && !Number.isNaN(v.max_reasoning_effort)) out.max_reasoning_effort = v.max_reasoning_effort
  out.allow_messages_dispatch = v.allow_messages_dispatch
  out.profit_control_enabled = v.profit_control_enabled
  if (v.profit_control_enabled) {
    if (v.profit_min_margin_percent !== undefined && !Number.isNaN(v.profit_min_margin_percent)) out.profit_min_margin_percent = v.profit_min_margin_percent
    if (v.profit_safety_buffer_percent !== undefined && !Number.isNaN(v.profit_safety_buffer_percent)) out.profit_safety_buffer_percent = v.profit_safety_buffer_percent
  }
  return out
}

function GroupForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  serverError,
  submitLabel,
}: {
  defaultValues?: Partial<GroupFormData>
  onSubmit: SubmitHandler<GroupFormData>
  onCancel: () => void
  submitting?: boolean
  serverError?: string | null
  submitLabel?: string
}) {
  const { t } = useTranslation()
  const schema = buildSchema()
  const form = useForm<GroupFormData>({
    // @ts-ignore zodResolver coerce for decimal precision
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      rate_multiplier: (defaultValues?.rate_multiplier as number) ?? 1,
      platform: (defaultValues?.platform as string) ?? "openai",
      supported_model_scopes: (defaultValues?.supported_model_scopes as string) ?? "",
      image_price_1k: defaultValues?.image_price_1k,
      image_price_2k: defaultValues?.image_price_2k,
      image_price_4k: defaultValues?.image_price_4k,
      video_price_480p: defaultValues?.video_price_480p,
      video_price_720p: defaultValues?.video_price_720p,
      video_price_1080p: defaultValues?.video_price_1080p,
      max_reasoning_effort: defaultValues?.max_reasoning_effort,
      allow_messages_dispatch: defaultValues?.allow_messages_dispatch ?? false,
      profit_control_enabled: defaultValues?.profit_control_enabled ?? false,
      profit_min_margin_percent: defaultValues?.profit_min_margin_percent,
      profit_safety_buffer_percent: defaultValues?.profit_safety_buffer_percent,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name ?? "",
        description: defaultValues.description ?? "",
        rate_multiplier: (defaultValues.rate_multiplier as number) ?? 1,
        platform: (defaultValues.platform as string) ?? "openai",
        supported_model_scopes: (defaultValues.supported_model_scopes as string) ?? "",
        image_price_1k: defaultValues.image_price_1k,
        image_price_2k: defaultValues.image_price_2k,
        image_price_4k: defaultValues.image_price_4k,
        video_price_480p: defaultValues.video_price_480p,
        video_price_720p: defaultValues.video_price_720p,
        video_price_1080p: defaultValues.video_price_1080p,
        max_reasoning_effort: defaultValues.max_reasoning_effort,
        allow_messages_dispatch: defaultValues.allow_messages_dispatch ?? false,
        profit_control_enabled: defaultValues.profit_control_enabled ?? false,
        profit_min_margin_percent: defaultValues.profit_min_margin_percent,
        profit_safety_buffer_percent: defaultValues.profit_safety_buffer_percent,
      })
    }
  }, [defaultValues, form])

  const profitEnabled = form.watch("profit_control_enabled")

  return (
    // @ts-ignore - handleSubmit generic inference
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Tabs defaultValue="basic">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="g-name">{t("common.name")}</Label>
            <Input id="g-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-desc">Description</Label>
            <Textarea id="g-desc" {...form.register("description")} rows={2} placeholder="Group purpose / notes" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="g-rate">Rate Multiplier (precision preserved)</Label>
              <Input id="g-rate" type="number" step="0.0001" {...form.register("rate_multiplier")} aria-invalid={!!form.formState.errors.rate_multiplier} />
              {form.formState.errors.rate_multiplier && <p className="text-sm text-destructive">{form.formState.errors.rate_multiplier.message}</p>}
              <p className="text-xs text-muted-foreground">Decimal precision not rounded; null vs 0 distinguished.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-platform">Platform</Label>
              <Input id="g-platform" {...form.register("platform")} placeholder="openai / claude / gemini" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="g-scopes">Supported Model Scopes (comma-separated)</Label>
            <Textarea id="g-scopes" {...form.register("supported_model_scopes")} rows={3} placeholder="gpt-4o, claude-3-5-sonnet, gemini-2.0-flash" />
            <p className="text-xs text-muted-foreground">Maps to supported_model_scopes[]; empty = all.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="g-dispatch" checked={form.watch("allow_messages_dispatch")} onCheckedChange={(v) => form.setValue("allow_messages_dispatch", v)} />
            <Label htmlFor="g-dispatch">Allow Messages Dispatch</Label>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Image 1K</Label>
              <Input type="number" step="0.0001" {...form.register("image_price_1k")} placeholder="e.g. 0.01" />
            </div>
            <div className="space-y-2">
              <Label>Image 2K</Label>
              <Input type="number" step="0.0001" {...form.register("image_price_2k")} placeholder="e.g. 0.02" />
            </div>
            <div className="space-y-2">
              <Label>Image 4K</Label>
              <Input type="number" step="0.0001" {...form.register("image_price_4k")} placeholder="e.g. 0.04" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Video 480p</Label>
              <Input type="number" step="0.0001" {...form.register("video_price_480p")} />
            </div>
            <div className="space-y-2">
              <Label>Video 720p</Label>
              <Input type="number" step="0.0001" {...form.register("video_price_720p")} />
            </div>
            <div className="space-y-2">
              <Label>Video 1080p</Label>
              <Input type="number" step="0.0001" {...form.register("video_price_1080p")} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Switch id="g-profit" checked={profitEnabled} onCheckedChange={(v) => form.setValue("profit_control_enabled", v)} />
            <Label htmlFor="g-profit">Profit Control Enabled</Label>
          </div>
          {profitEnabled ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Margin %</Label>
                <Input type="number" step="0.01" {...form.register("profit_min_margin_percent")} />
              </div>
              <div className="space-y-2">
                <Label>Safety Buffer %</Label>
                <Input type="number" step="0.01" {...form.register("profit_safety_buffer_percent")} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Enable to configure min margin & safety buffer (per parity doc).</p>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Max Reasoning Effort</Label>
            <Input type="number" {...form.register("max_reasoning_effort")} placeholder="0 = unlimited" />
            <p className="text-xs text-muted-foreground">Reasoning effort policy; 0 or empty = no limit.</p>
          </div>
        </TabsContent>
      </Tabs>

      {serverError ? <p className="text-sm text-destructive" role="alert">{serverError}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>{(t("common.cancel") as string) || "Cancel"}</Button>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? ((t("common.saving") as string) || "Saving...") : (submitLabel || (t("common.confirm") as string) || "Confirm")}</Button>
      </DialogFooter>
    </form>
  )
}

function GroupsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const pageSize = 10
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<GroupRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => setPage(1), [debounced])

  const query = useQuery({
    queryKey: queryKeys.admin.groups.list({ page, search: debounced }),
    queryFn: ({ signal }) => groupsAPI.list({ page, page_size: pageSize, search: debounced || undefined }, { signal }),
  })

  const createMut = useMutation({
    mutationFn: (data: GroupFormData) => groupsAPI.create(toPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.groups.all() })
      setCreateOpen(false); setFormError(null); toast.success(t("common.saved") as string)
    },
    onError: (err) => {
      const msg = getAppErrorMessage(err)
      // 409 name conflict → map to form error, else toast
      if (String(msg).toLowerCase().includes("exist") || String(msg).toLowerCase().includes("conflict") || (err as { status?: number })?.status === 409) {
        setFormError(msg)
      } else {
        setFormError(msg)
      }
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupFormData }) => groupsAPI.update(id, toPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.groups.all() })
      setEditRow(null); setFormError(null); toast.success(t("common.saved") as string)
    },
    onError: (err) => setFormError(getAppErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => groupsAPI.delete(id),
    onSuccess: () => {
      const total = ((query.data as { total?: number })?.total ?? 0) - 1
      const pages = Math.max(1, Math.ceil(total / pageSize))
      if (page > pages) setPage(pages)
      qc.invalidateQueries({ queryKey: queryKeys.admin.groups.all() })
      setDeleteId(null); toast.success(t("common.deleted") as string)
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  const raw = query.data as { items?: GroupRow[]; total?: number } | undefined
  const rows: GroupRow[] = raw?.items ?? []
  const total = raw?.total ?? rows.length
  const deleteRow = deleteId != null ? rows.find((r) => r.id === deleteId) : null

  // type-safe defaultValues for edit: convert array scopes to comma string, keep decimals as-is
  const editDefaults: Partial<GroupFormData> | undefined = editRow ? {
    name: editRow.name,
    description: editRow.description ?? "",
    rate_multiplier: Number(editRow.rate_multiplier) || 1,
    platform: editRow.platform ?? "openai",
    supported_model_scopes: Array.isArray(editRow.supported_model_scopes) ? editRow.supported_model_scopes.join(", ") : (typeof editRow.supported_model_scopes === "string" ? (editRow.supported_model_scopes as string) : ""),
    image_price_1k: editRow.image_price_1k,
    image_price_2k: editRow.image_price_2k,
    image_price_4k: editRow.image_price_4k,
    video_price_480p: editRow.video_price_480p,
    video_price_720p: editRow.video_price_720p,
    video_price_1080p: editRow.video_price_1080p,
    max_reasoning_effort: editRow.max_reasoning_effort,
    allow_messages_dispatch: editRow.allow_messages_dispatch ?? false,
    profit_control_enabled: editRow.profit_control_enabled ?? false,
    profit_min_margin_percent: editRow.profit_min_margin_percent,
    profit_safety_buffer_percent: editRow.profit_safety_buffer_percent,
  } : undefined

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.groups.title" action={<Button onClick={() => { setFormError(null); setCreateOpen(true) }}>{t("common.create") as string}</Button>} />
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder={t("common.searchPlaceholder") as string} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" aria-label={t("common.search") as string} />
            <Button variant="ghost" onClick={() => setSearch("")}>{t("common.reset") as string}</Button>
            <Button variant="outline" onClick={() => query.refetch()} className="ml-auto">{t("common.refresh") as string}</Button>
          </div>
          <DataTable<GroupRow>
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: t("common.name") as string, accessorKey: "name" },
              { header: (t("admin.groups.rate") as string) || "Rate", accessorKey: "rate_multiplier", align: "right", cell: (r) => String(r.rate_multiplier ?? "-") },
              { header: (t("admin.groups.profit") as string) || "Profit", cell: (r) => <StatusBadge status={r.profit_control_enabled ? "success" : "default"} label={r.profit_control_enabled ? (t("common.enabled") as string) : (t("common.disabled") as string)} /> },
              { header: t("common.status") as string, cell: (r) => (r.status ? <StatusBadge status="default" label={String(r.status)} /> : <span className="text-muted-foreground">-</span>) },
              {
                header: t("common.actions") as string,
                align: "right",
                cell: (row) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setEditRow(row) }}>{t("common.edit") as string}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>{t("common.delete") as string}</Button>
                  </div>
                ),
              },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? getAppErrorMessage(query.error) : null}
            onRetry={() => query.refetch()}
            emptyTitle={t("common.noData") as string}
            getRowId={(r) => r.id}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          <p className="text-xs text-muted-foreground">{(t("admin.groups.parityNote") as string) || "Pricing precision preserved; null vs 0 distinguished; Tabs mirror GroupsView.vue sections."}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setFormError(null) } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("common.create") as string}</DialogTitle></DialogHeader>
            <GroupForm onSubmit={(v) => { setFormError(null); createMut.mutate(v) }} onCancel={() => setCreateOpen(false)} submitting={createMut.isPending} serverError={formError} submitLabel={t("common.create") as string} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) { setEditRow(null); setFormError(null) } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("common.edit") as string}</DialogTitle></DialogHeader>
            {editRow ? (
              <GroupForm defaultValues={editDefaults} onSubmit={(v) => { if (!editRow) return; setFormError(null); updateMut.mutate({ id: editRow.id, data: v }) }} onCancel={() => setEditRow(null)} submitting={updateMut.isPending} serverError={formError} submitLabel={t("common.save") as string} />
            ) : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteId != null}
          onOpenChange={(o) => { if (!o) setDeleteId(null) }}
          title={t("common.delete") as string}
          description={deleteRow ? `Delete '${deleteRow.name}' (ID ${deleteRow.id})? This cannot be undone.` : (t("common.confirmDelete") as string) || "Delete this item? This cannot be undone."}
          onConfirm={() => { if (deleteId != null) deleteMut.mutate(deleteId) }}
          loading={deleteMut.isPending}
        />
      </PageContainer>
    </AdminShell>
  )
}