import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"

type Row = { id: number; name?: string; title?: string; email?: string; status?: string; created_at?: string }
const cols: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID", enableSorting: true },
  { accessorKey: "name", header: "Name", cell: ({ row }) => (row.original.name || row.original.title || row.original.email || String(row.original.id)) as string },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "created_at", header: "Created", enableSorting: true },
]
export function RedeemPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-redeem", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/redeem-codes", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  return (
    <Page>
      <PageHeader title={t("admin.redeem.title") as string || "Redeem"} description="Redeem management." actions={<Button>Create</Button>} />
      <Toolbar><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No data" /></Section>
    </Page>
  )
}
