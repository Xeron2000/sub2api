import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section, Toolbar } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/shared/SearchInput"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

type Row = { id: number; prompt: string; status: string; created_at: string }

export function PromptAuditPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["prompt-audit-list", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/prompt-audit/records", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const configQ = useQuery({ queryKey: ["prompt-audit-config"], queryFn: async () => (await httpClient.get("/admin/prompt-audit/config")).data })
  const auditMut = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => (await httpClient.post(`/admin/prompt-audit/records/${id}/${action}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-audit-list"] }),
  })
  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "prompt", header: "Prompt" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> },
    { accessorKey: "created_at", header: "Time" },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => auditMut.mutate({ id: row.original.id, action: "approve" })}>Approve</Button>
        <Button size="sm" variant="ghost" onClick={() => auditMut.mutate({ id: row.original.id, action: "reject" })}>Reject</Button>
      </div>
    )},
  ]
  return (
    <Page>
      <PageHeader title="Prompt Audit" description="Policy events and manual review — connected to /admin/prompt-audit/*." />
      <Card className="rounded-none"><CardContent className="p-4 text-xs"><pre className="bg-muted p-2 overflow-auto max-h-32">{JSON.stringify(configQ.data ?? {}, null, 2)}</pre></CardContent></Card>
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No audit records" /></Section>
    </Page>
  )
}
