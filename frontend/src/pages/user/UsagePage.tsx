import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type Row = { id: number; model: string; channel?: string; tokens: number; created_at: string; error?: string }
type ErrorRow = { id: number; message: string; request?: string; response?: string }

export function UsagePage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [model, setModel] = useState("all")
  const [channel, setChannel] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedError, setSelectedError] = useState<ErrorRow | null>(null)

  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "channel", header: "Channel" },
    { accessorKey: "tokens", header: "Tokens" },
    { accessorKey: "created_at", header: "Time" },
    {
      id: "error",
      header: "Error",
      cell: ({ row }) => row.original.error ? <Button variant="ghost" size="sm" onClick={async () => {
        const res = await httpClient.get("/usage/errors/" + row.original.id)
        setSelectedError(res.data as ErrorRow)
      }}>View</Button> : <span className="text-muted-foreground text-xs">—</span>,
    },
  ]
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["usage", search, pagination.pageIndex, sorting, model, channel, dateFrom, dateTo],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/usage", {
        params: {
          search, model: model !== "all" ? model : undefined, channel: channel !== "all" ? channel : undefined,
          start: dateFrom || undefined, end: dateTo || undefined,
          page: pagination.pageIndex + 1, page_size: pagination.pageSize,
          sort: sorting.length ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined,
        },
      })
      const d = res.data as { items?: Row[] } | Row[]
      if (Array.isArray(d)) return d as Row[]
      return (d as { items?: Row[] }).items ?? []
    },
  })
  return (
    <Page>
      <PageHeader title="Usage" description="Multi-dimensional filtering with error drawer." />
      <Toolbar>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1"><Label className="text-xs">Search</Label><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[180px]" /></div>
          <div className="space-y-1"><Label className="text-xs">Model</Label>
            <Select value={model} onValueChange={setModel}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All models</SelectItem><SelectItem value="gpt-4o">gpt-4o</SelectItem><SelectItem value="claude-3">claude-3</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Channel</Label>
            <Select value={channel} onValueChange={setChannel}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All channels</SelectItem><SelectItem value="1">Channel 1</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" /></div>
          <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" /></div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mb-1">Filter</Button>
        </div>
      </Toolbar>
      <Section><DataTable data={(data as Row[]) ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No usage records" /></Section>
      <Sheet open={!!selectedError} onOpenChange={(o) => !o && setSelectedError(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>Error Detail #{selectedError?.id}</SheetTitle></SheetHeader>
          {selectedError && (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-destructive whitespace-pre-wrap">{selectedError.message}</p>
              <div><p className="font-medium">Request</p><pre className="bg-muted p-2 text-xs overflow-auto max-h-40">{selectedError.request ?? "—"}</pre></div>
              <div><p className="font-medium">Response</p><pre className="bg-muted p-2 text-xs overflow-auto max-h-40">{selectedError.response ?? "—"}</pre></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Page>
  )
}
