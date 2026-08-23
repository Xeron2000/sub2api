import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { httpClient } from "@/api/client/http-client"
import { channelKeys } from "@/api/query-keys"
import { Page, PageHeader, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type ChannelRow = { id: number; name: string; platform: string; status: string; enabled: boolean }

const columns: ColumnDef<ChannelRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "platform", header: "Platform", cell: ({ getValue }) => <StatusBadge status="info">{getValue<string>()}</StatusBadge> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "active" ? "success" : "warning"}>{getValue<string>()}</StatusBadge> },
  { id: "actions", header: "Actions", cell: () => <Button variant="ghost" size="sm">Edit</Button> },
]

const schema = z.object({ name: z.string().min(2, "Name is required") })
type FormValues = z.infer<typeof schema>

export function ChannelsPage() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: channelKeys.list({ search }),
    queryFn: async () => {
      const res = await httpClient.get<{ items: ChannelRow[] }>("/admin/channels", { params: { search, page: 1, page_size: 20 } })
      const d = res.data as { items?: ChannelRow[] } | ChannelRow[]
      if (Array.isArray(d)) return d as ChannelRow[]
      return (d as { items?: ChannelRow[] }).items ?? []
    },
  })

  const onSubmit = (values: FormValues) => {
    console.log(values)
    setOpen(false)
  }

  return (
    <Page>
      <PageHeader
        title="Channel Management"
        description="Manage channels and pricing. Covers advanced domain state."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Create channel</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create channel</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        emptyTitle="No channels"
        emptyDescription="Create a channel to route requests."
      />
    </Page>
  )
}
