import { toast } from "sonner"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/shared/SearchInput"
import { Label } from "@/components/ui/label"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Row = { id: number; name?: string; platform?: string; status?: string; base_url?: string }

const schema = z.object({ name: z.string().min(1), platform: z.string().min(1), api_key: z.string().min(1), base_url: z.string().url().optional().or(z.literal("")) })
type V = z.infer<typeof schema>

export function AccountsPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const qc = useQueryClient()
  const form = useForm<V>({ resolver: zodResolver(schema as never), defaultValues: { name: "", platform: "openai", api_key: "", base_url: "" } })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-accounts", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/accounts", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const createMut = useMutation({ mutationFn: async (v: V) => (await httpClient.post("/admin/accounts", { name: v.name, platform: v.platform, credentials: { api_key: v.api_key, base_url: v.base_url }, group_ids: [] })).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-accounts"] }); setOpen(false); form.reset() } })
  const updateMut = useMutation({ mutationFn: async (v: V) => (await httpClient.put(`/admin/accounts/${editing!.id}`, { name: v.name, platform: v.platform, credentials: { api_key: v.api_key, base_url: v.base_url } })).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-accounts"] }); setOpen(false); setEditing(null); form.reset() } })
  const deleteMut = useMutation({ mutationFn: async () => (await httpClient.delete(`/admin/accounts/${deleting!.id}`)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-accounts"] }); setDeleting(null) } })
  const testMut = useMutation({ mutationFn: async (id: number) => (await httpClient.post(`/admin/accounts/${id}/test`)).data, onSuccess: (d) => toast.info(JSON.stringify(d)) })

  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name", cell: ({ row }) => (row.original.name ?? String(row.original.id)) as string },
    { accessorKey: "platform", header: "Platform" },
    { accessorKey: "status", header: "Status" },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm">⋯</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => { setEditing(row.original); form.reset({ name: row.original.name ?? "", platform: row.original.platform ?? "openai", api_key: "", base_url: row.original.base_url ?? "" }); setOpen(true) }}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => testMut.mutate(row.original.id)}>Test</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(row.original)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <Page>
      <PageHeader title={t("admin.accounts.title") as string || "Accounts"} description="Upstream accounts with credentials and health check." actions={<Button onClick={() => { setEditing(null); form.reset({ name: "", platform: "openai", api_key: "", base_url: "" }); setOpen(true) }}>Create account</Button>} />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No accounts" /></Section>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent><SheetHeader><SheetTitle>{editing ? "Edit account" : "Create account"}</SheetTitle></SheetHeader>
          <form onSubmit={form.handleSubmit((v) => editing ? updateMut.mutate(v) : createMut.mutate(v))} className="mt-6 space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input {...form.register("name")} /></div>
            <div className="space-y-1"><Label>Platform</Label><Input {...form.register("platform")} placeholder="openai" /></div>
            <div className="space-y-1"><Label>API Key</Label><Input {...form.register("api_key")} placeholder="sk- or nvapi-" /></div>
            <div className="space-y-1"><Label>Base URL</Label><Input {...form.register("base_url")} placeholder="https://api.openai.com/v1" /></div>
            <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete account {deleting?.name}?</DialogTitle></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </Page>
  )
}
