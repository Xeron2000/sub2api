import { useQuery } from "@tanstack/react-query"
import { getModelPlaza } from "@/api/public"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function ModelPlazaPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["model-plaza"], queryFn: getModelPlaza })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  const models = (data as unknown as { models?: { id: string; name: string }[] })?.models ?? []
  if (models.length === 0) return <EmptyState title="No models" description="Model plaza is empty." />
  return (
    <Page>
      <PageHeader title="Model Plaza" description="Available models and groups." />
      <Section title="Models">
        <div className="grid gap-3 md:grid-cols-3">
          {models.map((m) => (
            <Card key={m.id} className="rounded-none"><CardHeader><CardTitle className="text-sm">{m.name || m.id}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{m.id}</CardContent></Card>
          ))}
        </div>
      </Section>
    </Page>
  )
}
