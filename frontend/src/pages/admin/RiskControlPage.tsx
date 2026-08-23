import { toast } from "sonner"
import { useEffect } from "react"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

const schema = z.object({ enabled: z.boolean().optional(), blocked_keywords: z.string().optional(), max_requests_per_minute: z.number().int().optional() })
type V = z.infer<typeof schema>

export function RiskControlPage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["risk-config"], queryFn: async () => (await httpClient.get("/admin/risk-control/config")).data as Record<string, unknown> })
  const form = useForm<V>({ resolver: zodResolver(schema as never), defaultValues: { enabled: false, blocked_keywords: "", max_requests_per_minute: 60 } })
  useEffect(() => {
    if (data) form.reset({
      enabled: Boolean((data as { enabled?: boolean }).enabled),
      blocked_keywords: Array.isArray((data as { blocked_keywords?: string[] }).blocked_keywords) ? (data as { blocked_keywords: string[] }).blocked_keywords.join(",") : ((data as { blocked_keywords?: string }).blocked_keywords ?? ""),
      max_requests_per_minute: (data as { max_requests_per_minute?: number }).max_requests_per_minute ?? 60,
    })
  }, [data, form])
  const mut = useMutation({
    mutationFn: async (v: V) => (await httpClient.put("/admin/risk-control/config", { ...v, blocked_keywords: v.blocked_keywords ? v.blocked_keywords.split(",").map(s=>s.trim()).filter(Boolean) : [] })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["risk-config"] }); toast.success("Risk config saved") },
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  return (
    <Page>
      <PageHeader title="Risk Control" description="Content moderation, blocked keywords and rate limits — wired to /admin/risk-control/config." />
      <Section>
        <Card className="rounded-none">
          <CardHeader><CardTitle className="text-sm">Policy Configuration</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="max-w-xl space-y-4">
              <div className="flex items-center justify-between"><Label>Enabled</Label><Switch checked={!!form.watch("enabled")} onCheckedChange={(c) => form.setValue("enabled", c)} /></div>
              <div className="space-y-1"><Label>Blocked Keywords (comma separated)</Label><Textarea {...form.register("blocked_keywords")} placeholder="politics, spam, ..." rows={3} /></div>
              <div className="space-y-1"><Label>Max Requests / Minute</Label><Input type="number" {...form.register("max_requests_per_minute", { valueAsNumber: true })} /></div>
              <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : "Save Risk Config"}</Button>
              <Button type="button" variant="outline" className="ml-2" onClick={async () => { const r = await httpClient.post("/admin/risk-control/test", { prompt: "test" }); toast.info(JSON.stringify(r.data)) }}>Test Prompt</Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </Page>
  )
}
