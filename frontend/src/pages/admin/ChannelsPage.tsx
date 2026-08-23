import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { httpClient } from "@/api/client/http-client"
import { channelKeys } from "@/api/query-keys"
import { Page, PageHeader, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

type ChannelRow = { id: number; name: string; platform: string; status: string; enabled: boolean }

const schema = z.object({ name: z.string().min(2, "Name is required") })
type FormValues = z.infer<typeof schema>

export function ChannelsPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetRow, setSheetRow] = useState<ChannelRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChannelRow | null>(null)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } })
  const sheetForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: channelKeys.list({ search, page: pagination.pageIndex + 1, pageSize: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined }),
    queryFn: async () => {
      const res = await httpClient.get<{ items: ChannelRow[] }>("/admin/channels", {
        params: { search, page: pagination.pageIndex + 1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined },
      })
      const d = res.data as { items?: ChannelRow[] } | ChannelRow[]
      if (Array.isArray(d)) return d as ChannelRow[]
      return (d as { items?: ChannelRow[] }).items ?? []
    },
  })

  const onCreate = (values: FormValues) => {
    console.log("create channel", values)
    setDialogOpen(false)
    form.reset()
  }

  const onSheetSave = (values: FormValues) => {
    console.log("update channel", sheetRow?.id, values)
    setSheetRow(null)
  }

  const columns: ColumnDef<ChannelRow>[] = [
    { accessorKey: "id", header: "ID", enableSorting: true },
    { accessorKey: "name", header: "Name", enableSorting: true },
    { accessorKey: "platform", header: "Platform", cell: ({ getValue }) => <StatusBadge status="info">{getValue<string>()}</StatusBadge> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "active" ? "success" : "warning"}>{getValue<string>()}</StatusBadge> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">⋯</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSheetRow(row.original); sheetForm.reset({ name: row.original.name }) }}>Edit in Sheet</DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("duplicate")}>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(row.original)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title={t("admin.channels.title")}
        description={t("admin.channels.description")}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button>Create channel</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create channel</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
                </div>
                <Button type="submit" className="w-full">Save changes</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Toolbar>
        <Input placeholder="Filter channels..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
      </Toolbar>
      <DataTable
        data={data ?? []}
        columns={columns}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        onRetry={() => refetch()}
        pagination={pagination}
        sorting={sorting}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        emptyTitle="No channels"
        emptyDescription="Create a channel to route requests."
      />

      {/* Sheet for editing — demonstrates Sheet + RHF+Zod */}
      <Sheet open={!!sheetRow} onOpenChange={(o) => !o && setSheetRow(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit channel &quot;{sheetRow?.name}&quot;</SheetTitle>
            <SheetDescription>Update channel configuration.</SheetDescription>
          </SheetHeader>
          <form onSubmit={sheetForm.handleSubmit(onSheetSave)} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="sheet-name">Name</Label>
              <Input id="sheet-name" {...sheetForm.register("name")} />
              {sheetForm.formState.errors.name && <p className="text-destructive text-xs">{sheetForm.formState.errors.name.message}</p>}
            </div>
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete channel &quot;{deleteTarget?.name}&quot;?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Requests using this channel will be rerouted or fail. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { console.log("delete", deleteTarget?.id); setDeleteTarget(null) }}>Delete channel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
