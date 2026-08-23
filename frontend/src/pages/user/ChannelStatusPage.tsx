import { Page, PageHeader, Section } from "@/components/shared/Page"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { MetricCard } from "@/components/shared/MetricCard"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function ChannelStatusPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["channel-status"],
    queryFn: async () => {
      const res = await httpClient.get("/channels/available")
      return res.data
    },
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  const list = (data as unknown as { items?: unknown[] } | unknown[]) 
  const count = Array.isArray(list) ? list.length : Array.isArray((list as { items?: unknown[] })?.items) ? (list as { items?: unknown[] }).items!.length : 0
  return (
    <Page>
      <PageHeader title="Channel Status" />
      <Section><div className="grid gap-4 md:grid-cols-3"><MetricCard label="Monitors" value={count} hint="Active" /></div></Section>
    </Page>
  )
}
