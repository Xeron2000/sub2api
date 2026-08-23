import { Page, PageHeader, Section, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { SearchInput } from "@/components/shared/SearchInput"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"

type Row = { id: string; order_id?: string; amount: number; status: string; created_at: string; pay_method?: string }
export function OrdersPage() {
  const navigate = useNavigate()
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const cols: ColumnDef<Row>[] = [
    { accessorKey: "id", header: "Order" , cell: ({ row }) => (row.original.order_id ?? row.original.id) as string },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "pay_method", header: "Method" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> },
    { accessorKey: "created_at", header: "Time" },
    { id: "action", header: "Action", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => navigate("/payment/qrcode?order_id=" + (row.original.order_id ?? row.original.id))}>View</Button> },
  ]
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[]; total?: number }>("/payment/orders", { params: { search: search || undefined, page: pagination.pageIndex + 1, page_size: pagination.pageSize, sort: sorting.length ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
    refetchInterval: 10000,
  })
  return (
    <Page>
      <PageHeader title="My Orders" description="Polling /payment/orders — backend-authoritative status." />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No orders yet" emptyDescription="Purchase a subscription to see orders." emptyActionLabel="Go to Purchase" emptyAction={() => window.location.href="/purchase"} /></Section>
    </Page>
  )
}
