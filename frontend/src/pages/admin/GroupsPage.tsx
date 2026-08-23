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

type Row = { id: number; name: string; description?: string; status?: string }

const schema = z.object({ name: z.string().min(1), description: z.string().optional() })
type V = z.infer<typeof schema>

export function GroupsPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const qc = useQueryClient()
  const form = useForm<V>({ resolver: zodResolver(schema as never), defaultValues: { name: "", description: "" } })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-groups", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/groups", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const createMut = useMutation({ mutationFn: async (v: V) => (await httpClient.post("/admin/groups", v)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-groups"] }); setOpen(false); form.reset() } })
  const updateMut = useMutation({ mutationFn: async (v: V) => (await httpClient.put(`/admin/groups/${editing!.id}`, v)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-groups"] }); setOpen(false); setEditing(null); form.reset() } })
  const deleteMut = useMutation({ mutationFn: async () => (await httpClient.delete(`/admin/groups/${deleting!.id}`)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-groups"] }); setDeleting(null) } })

  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm">⋯</Button></DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem onClick={() => { setEditing(row.original); form.reset({ name: row.original.name, description: row.original.description ?? "" }); setOpen(true) }}>Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleting(row.original)}>Delete</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <Page>
      <PageHeader title={t("admin.groups.title") as string || "Groups"} description="Groups management." actions={<Button onClick={() => { setEditing(null); form.reset({ name: "", description: "" }); setOpen(true) }}>Create group</Button>} />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No groups" /></Section>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent><SheetHeader><SheetTitle>{editing ? "Edit group" : "Create group"}</SheetTitle></SheetHeader>
          <form onSubmit={form.handleSubmit((v) => editing ? updateMut.mutate(v) : createMut.mutate(v))} className="mt-6 space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input {...form.register("name")} /></div>
            <div className="space-y-1"><Label>Description</Label><Input {...form.register("description")} /></div>
            <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete group {deleting?.name}?</DialogTitle></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </Page>
  )
}
