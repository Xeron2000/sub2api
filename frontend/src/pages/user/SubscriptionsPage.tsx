import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function SubscriptionsPage() {
  const summaryQ = useQuery({ queryKey: ["sub-summary"], queryFn: async () => (await httpClient.get("/subscriptions/summary")).data, retry: false })
  const activeQ = useQuery({ queryKey: ["sub-active"], queryFn: async () => (await httpClient.get("/subscriptions/active")).data, retry: false })
  const progressQ = useQuery({ queryKey: ["sub-progress"], queryFn: async () => (await httpClient.get("/subscriptions/progress")).data, retry: false })
  const purchaseMut = useMutation({
    mutationFn: async (plan: string) => (await httpClient.post("/payment/create", { plan })).data,
    onSuccess: (d) => { const oid = (d as { order_id?: string })?.order_id; if (oid) window.location.href = `/payment/qrcode?order_id=${oid}`; else toast.info(JSON.stringify(d)) },
  })
  if (summaryQ.isLoading) return <LoadingState />
  if (summaryQ.error) return <ErrorState message={(summaryQ.error as Error).message} onRetry={() => summaryQ.refetch()} />
  return (
    <Page>
      <PageHeader title="Subscriptions" description="Active plans, quota progress and renewal — GET /user/subscriptions/*." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader><CardContent><pre className="text-xs bg-muted p-2 overflow-auto max-h-40">{JSON.stringify(summaryQ.data ?? {}, null, 2)}</pre></CardContent></Card>
        <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><pre className="text-xs bg-muted p-2 overflow-auto max-h-40">{JSON.stringify(activeQ.data ?? {}, null, 2)}</pre></CardContent></Card>
      </div>
      <Section title="Quota Progress">
        <Card className="rounded-none"><CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Used</span><span>{(progressQ.data as { used?: number })?.used ?? 0} / {(progressQ.data as { total?: number })?.total ?? 0}</span></div>
          <Progress value={(() => { const p = progressQ.data as { used?: number; total?: number } | undefined; if (!p?.total) return 0; return Math.round((p.used! / p.total!) * 100) })()} />
          <Button size="sm" onClick={() => progressQ.refetch()}>Refresh Progress</Button>
        </CardContent></Card>
      </Section>
      <Section title="Purchase">
        <div className="flex gap-2">
          <Button onClick={() => purchaseMut.mutate("basic")} disabled={purchaseMut.isPending}>Buy Basic</Button>
          <Button variant="outline" onClick={() => purchaseMut.mutate("pro")} disabled={purchaseMut.isPending}>Buy Pro</Button>
        </div>
      </Section>
    </Page>
  )
}
