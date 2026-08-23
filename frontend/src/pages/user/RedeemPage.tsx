import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTableUrlState } from "@/hooks/useTableUrlState"

type Row = { id: number; name: string; status?: string }
const cols: ColumnDef<Row>[] = [{ accessorKey: "id", header: "ID" }, { accessorKey: "name", header: "Name" }, { accessorKey: "status", header: "Status" }]
const apiMap: Record<string, string> = {
  Usage: "/user/usage",
  Redeem: "/user/redeem/history",
  Affiliate: "/user/aff",
  AvailableChannels: "/available-channels/available",
  Profile: "/user/profile",
  Subscriptions: "/user/subscriptions",
}
export function RedeemPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const path = apiMap["Redeem"] || "/user/redeem"
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["redeem", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>(path, { params: { search, page: pagination.pageIndex+1, page_size: pagination.pageSize } })
      const d = res.data as { items?: Row[] } | Row[] | Record<string, unknown>
      if (Array.isArray(d)) return d as Row[]
      if (d && typeof d === "object" && "items" in d) return (d as { items?: Row[] }).items ?? []
      return d ? [d as unknown as Row] : []
    },
  })
  return (
    <Page>
      <PageHeader title="Redeem" description="Redeem management." />
      <Toolbar><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={(data as Row[]) ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No data" /></Section>
    </Page>
  )
}
