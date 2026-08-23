import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { SearchInput } from "@/components/shared/SearchInput"
import { t } from "@/i18n"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Row = { id: number; name?: string; host?: string; status?: string }

const schema = z.object({ name: z.string().min(1), host: z.string().min(1) })
type V = z.infer<typeof schema>

export function ProxiesPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const qc = useQueryClient()
  const form = useForm<V>({ resolver: zodResolver(schema as never), defaultValues: { name: "", host: "" } })
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-proxies", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/proxies", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const createMut = useMutation({ mutationFn: async (v: V) => (await httpClient.post("/admin/proxies", v)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-proxies"] }); setOpen(false); form.reset() } })
  const updateMut = useMutation({ mutationFn: async (v: V) => (await httpClient.put(`/admin/proxies/${editing!.id}`, v)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-proxies"] }); setOpen(false); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: async () => (await httpClient.delete(`/admin/proxies/${deleting!.id}`)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-proxies"] }); setDeleting(null) } })
  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name", cell: ({ row }) => (row.original.name ?? String(row.original.id)) as string },
    { accessorKey: "host", header: "Host" },
    { accessorKey: "status", header: "Status" },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm">⋯</Button></DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem onClick={() => { setEditing(row.original); form.reset({ name: row.original.name ?? "", host: row.original.host ?? "" }); setOpen(true) }}>Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(row.original)}>Delete</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    )},
  ]
  return (
    <Page>
      <PageHeader title={t("admin.proxies.title") as string || "Proxies"} description="Proxies management." actions={<Button onClick={() => { setEditing(null); form.reset({ name: "", host: "" }); setOpen(true) }}>Create proxy</Button>} />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No proxies yet" emptyDescription="Create a proxy to route outbound traffic." emptyActionLabel="Create proxy" emptyAction={() => { setEditing(null); setOpen(true) }} /></Section>
      <Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>{editing ? "Edit proxy" : "Create proxy"}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit((v) => editing ? updateMut.mutate(v) : createMut.mutate(v))} className="mt-6 space-y-4">
          <div className="space-y-1"><Label>Name</Label><Input {...form.register("name")} /></div>
          <div className="space-y-1"><Label>Host</Label><Input {...form.register("host")} placeholder="http://proxy:8080" /></div>
          <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>Save</Button>
        </form>
      </SheetContent></Sheet>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Confirm delete?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This action is irreversible and will permanently delete the proxy.</p><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending} className="text-destructive hover:bg-destructive/10 hover:text-destructive">Confirm Delete</Button></DialogFooter></DialogContent></Dialog>
    </Page>
  )
}
