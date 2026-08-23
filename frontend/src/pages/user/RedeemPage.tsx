import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { useTableUrlState } from "@/hooks/useTableUrlState"

const schema = z.object({ code: z.string().min(4) })
type V = z.infer<typeof schema>
type Row = { id: number; code: string; quota: number; created_at: string }

export function RedeemPage() {
  const qc = useQueryClient()
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { code: "" } })
  const { pagination, sorting, setPagination, setSorting } = useTableUrlState({ pageSize: 20 })
  const cols: ColumnDef<Row>[] = [{ accessorKey: "id", header: "ID" }, { accessorKey: "code", header: "Code" }, { accessorKey: "quota", header: "Quota" }, { accessorKey: "created_at", header: "Time" }]
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["redeem-history", pagination.pageIndex],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Row[] }>("/redeem/history", { params: { page: pagination.pageIndex+1, page_size: pagination.pageSize } })
      const d = res.data as { items?: Row[] } | Row[]
      return Array.isArray(d) ? d : (d as { items?: Row[] }).items ?? []
    },
  })
  const mut = useMutation({
    mutationFn: async (v: V) => (await httpClient.post("/redeem", v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["redeem-history"] }); form.reset(); toast.success("Redeem successful"); },
    onError: (e) => toast.error((e as Error).message),
  })
  return (
    <Page>
      <PageHeader title="Redeem" description="Enter redemption code to add quota — POST /redeem." />
      <Section>
        <Card className="rounded-none max-w-md"><CardHeader><CardTitle className="text-sm">Redeem Code</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-3">
              <div className="space-y-1"><Label>Code</Label><Input {...form.register("code")} placeholder="XXXX-XXXX-XXXX" /></div>
              <Button type="submit" className="w-full" disabled={mut.isPending}>{mut.isPending ? "Redeeming..." : "Redeem"}</Button>
            </form>
          </CardContent>
        </Card>
      </Section>
      <Section title="History">
        <DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} pagination={pagination} sorting={sorting} onPaginationChange={setPagination} onSortingChange={setSorting} emptyTitle="No redeem history" />
      </Section>
    </Page>
  )
}
