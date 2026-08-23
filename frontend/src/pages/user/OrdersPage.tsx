import { Page, PageHeader, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toolbar } from "@/components/shared/Page"

type Row = { id: string; amount: number; status: string }
const cols: ColumnDef<Row>[] = [{ accessorKey: "id", header: "Order" }, { accessorKey: "amount", header: "Amount" }, { accessorKey: "status", header: "Status" }]
export function OrdersPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", search, pagination.pageIndex],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/payment/orders", { params: { search, page: pagination.pageIndex+1 } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  return (
    <Page>
      <PageHeader title="My Orders" />
      <Toolbar><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} /></Section>
    </Page>
  )
}
