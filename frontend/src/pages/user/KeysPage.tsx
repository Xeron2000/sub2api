import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"
import { useState } from "react"

type Row = { id: number; name: string; status: string }
const cols: ColumnDef<Row>[] = [{ accessorKey: "id", header: "ID" }, { accessorKey: "name", header: "Name" }, { accessorKey: "status", header: "Status" }]
export function KeysPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [filter] = useState("")
  void filter
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["keys", search, pagination.pageIndex, sorting],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/user/api-keys", { params: { search, page: pagination.pageIndex + 1, page_size: pagination.pageSize } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  return (
    <Page>
      <PageHeader title={t("keys.title") as string || "API Keys"} description="Manage your API keys." actions={<Button>Create key</Button>} />
      <Toolbar><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button></Toolbar>
      <Section><DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No keys" /></Section>
    </Page>
  )
}
