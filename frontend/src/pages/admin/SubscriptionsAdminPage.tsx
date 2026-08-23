import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/SearchInput"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"

type Row = { id: number; name?: string; title?: string; email?: string; status?: string; created_at?: string }
const cols: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID", enableSorting: true },
  { accessorKey: "name", header: "Name", cell: ({ row }) => (row.original.name || row.original.title || row.original.email || String(row.original.id)) as string },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "created_at", header: "Created", enableSorting: true },
]
export function SubscriptionsAdminPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-subscriptionsadmin", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/admin/subscriptions", { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  return (
    <Page>
      <PageHeader title={t("admin.subscriptions.title") as string || "SubscriptionsAdmin"} description="SubscriptionsAdmin management." actions={<Button>Create</Button>} />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No data" emptyDescription="No records found. Try adjusting search or create a new entry." /></Section>
    </Page>
  )
}
