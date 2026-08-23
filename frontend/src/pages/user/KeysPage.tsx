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
import { t } from "@/i18n"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

type Row = { id: number; name: string; status: string; key?: string; allowed_ips?: string; group?: string }
const schema = z.object({ name: z.string().min(1), group: z.string().optional(), allowed_ips: z.string().optional() })
type V = z.infer<typeof schema>

export function KeysPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const form = useForm<V>({ resolver: zodResolver(schema as never), defaultValues: { name: "", group: "", allowed_ips: "" } })
  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "group", header: "Group" },
    { accessorKey: "allowed_ips", header: "IP Whitelist" },
    { accessorKey: "status", header: "Status" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={async () => { const res = await httpClient.get("/keys/" + r.id); const d = (res.data as { key?: string })?.key; if (d) { await navigator.clipboard.writeText(d); alert("Key copied") } else alert(JSON.stringify(res.data)) }}>Copy</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); form.reset({ name: r.name, group: r.group ?? "", allowed_ips: r.allowed_ips ?? "" }); setOpen(true) }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(r)}>Delete</Button>
          </div>
        )
      },
    },
  ]
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["keys", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[]; total?: number }>("/keys", { params: { search, page: pagination.pageIndex + 1, page_size: pagination.pageSize, sort: sorting.length ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const mut = useMutation({
    mutationFn: async (v: V) => {
      if (editing) return (await httpClient.put("/keys/" + editing.id, v)).data as { key?: string }
      return (await httpClient.post("/keys", v)).data as { key?: string; id?: number }
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["keys"] })
      setOpen(false)
      setEditing(null)
      form.reset({ name: "", group: "", allowed_ips: "" })
      const key = (d as { key?: string })?.key
      if (key) {
        setCreatedKey(key)
        navigator.clipboard.writeText(key).catch(() => {})
      }
    },
  })
  const delMut = useMutation({
    mutationFn: async () => (await httpClient.delete("/keys/" + deleting!.id)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); setDeleting(null) },
  })
  return (
    <Page>
      <PageHeader title={t("keys.title") as string || "API Keys"} description="Manage keys, groups, IP whitelist and copy." actions={<Button onClick={() => { setEditing(null); form.reset({ name: "", group: "", allowed_ips: "" }); setOpen(true) }}>Create key</Button>} />
      <Toolbar><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No keys" /></Section>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>{editing ? "Edit Key" : "Create Key"}</SheetTitle></SheetHeader>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4 mt-4">
            <div className="space-y-1"><Label>Name</Label><Input {...form.register("name")} /></div>
            <div className="space-y-1"><Label>Group</Label><Input {...form.register("group")} placeholder="default / premium ..." /></div>
            <div className="space-y-1"><Label>IP Whitelist (comma separated)</Label><Input {...form.register("allowed_ips")} placeholder="192.168.1.1, 10.0.0.0/24" /></div>
            <Button type="submit" className="w-full" disabled={mut.isPending}>{mut.isPending ? "Saving..." : "Save"}</Button>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete key {deleting?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={() => delMut.mutate()} disabled={delMut.isPending}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!createdKey} onOpenChange={(o) => !o && setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>API Key Created</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This is the only time the full key is shown. Copy it now.</p>
          <div className="bg-muted p-3 rounded text-sm font-mono break-all select-all">{createdKey}</div>
          <DialogFooter>
            <Button variant="outline" onClick={async () => { if (createdKey) await navigator.clipboard.writeText(createdKey); alert("Copied to clipboard") }}>Copy</Button>
            <Button onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
