import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

type Channel = { id: number; name: string; status: string; models?: string[]; quota?: number }

export function AvailableChannelsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["available-channels"],
    queryFn: async () => {
      const res = await httpClient.get<{ items: Channel[] } | Channel[]>("/channels/available")
      const d = res.data as { items?: Channel[] } | Channel[]
      return Array.isArray(d) ? d : (d as { items?: Channel[] }).items ?? []
    },
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  const list = (data as Channel[]) ?? []
  return (
    <Page>
      <PageHeader title="Available Channels" description="Healthy channels and supported models — GET /channels/available." />
      {list.length === 0 ? <Section><Card className="rounded-none"><CardContent className="p-6 text-sm text-muted-foreground">No available channels — contact admin or check /admin/channels/monitor.</CardContent></Card></Section> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="rounded-none">
              <CardHeader><CardTitle className="text-sm flex justify-between"><span>{c.name}</span><Badge variant={c.status === "active" ? "default" : "outline"}>{c.status}</Badge></CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1">
                <p className="text-muted-foreground">ID: {c.id} {c.quota !== undefined && `· Quota: ${c.quota}`}</p>
                <p className="truncate">{c.models?.join(", ") ?? "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}
