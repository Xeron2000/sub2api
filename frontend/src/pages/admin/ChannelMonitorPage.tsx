import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

type Row = { id: number; name: string; status: string }
const cols: ColumnDef<Row>[] = [{ accessorKey: "id", header: "ID" }, { accessorKey: "name", header: "Name" }, { accessorKey: "status", header: "Status" }]

export function ChannelMonitorPage() {
  const { data } = useQuery({ queryKey: ["channel-monitor"], queryFn: async () => (await httpClient.get("/admin/channel-monitors")).data })
  const items = (data as { items?: Row[] })?.items ?? (Array.isArray(data) ? data as Row[] : [])
  return (
    <Page>
      <PageHeader title="Channel Monitor" description="Monitor and templates." />
      <Section><DataTable data={items} columns={cols} emptyTitle="No monitors" /></Section>
      <Section title="V2 Matrix"><Card className="rounded-none"><CardHeader><CardTitle className="text-sm">RelayPulseMatrix via /admin/channel-monitors/monitor-v2</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Matrix, dimensions, snapshot APIs</CardContent></Card></Section>
    </Page>
  )
}
