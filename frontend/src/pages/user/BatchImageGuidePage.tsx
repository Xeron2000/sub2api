import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { useState } from "react"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

type Batch = { id: string; status: string; created_at: string }

export function BatchImageGuidePage() {
  const [prompt, setPrompt] = useState("a cat")
  const qc = useQueryClient()
  const cols: ColumnDef<Batch>[] = [{ accessorKey: "id", header: "ID" }, { accessorKey: "status", header: "Status" }, { accessorKey: "created_at", header: "Created" }]
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["image-batches"],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Batch[] } | Batch[]>("/v1/images/batches")
      const d = res.data as { items?: Batch[] } | Batch[]
      return Array.isArray(d) ? d : (d as { items?: Batch[] }).items ?? []
    },
    retry: false,
  })
  const mut = useMutation({
    mutationFn: async () => (await httpClient.post("/v1/images/batches", { prompt, n: 1 })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["image-batches"] }); alert("Batch submitted"); },
    onError: (e) => alert((e as Error).message),
  })
  return (
    <Page>
      <PageHeader title="Batch Image" description="Async batch workflow — submit and poll /v1/images/batches." />
      <Section>
        <Card className="rounded-none max-w-xl"><CardHeader><CardTitle className="text-sm">Create Batch</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Prompt</Label><Input value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Submitting..." : "Submit Batch"}</Button>
            <p className="text-xs text-muted-foreground">Poll GET /v1/images/batches/:id for status; download outputs when completed.</p>
          </CardContent>
        </Card>
      </Section>
      <Section title="Batches">
        <DataTable data={data ?? []} columns={cols} loading={isLoading} error={error ? (error as Error).message : null} onRetry={() => refetch()} emptyTitle="No batches yet" />
      </Section>
    </Page>
  )
}
