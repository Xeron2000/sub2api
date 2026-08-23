import { useQuery } from "@tanstack/react-query"
import { getModelPlaza } from "@/api/public"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/EmptyState"
import { normalizeError } from "@/api/errors/normalize-error"

export function ModelPlazaPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["model-plaza"], queryFn: getModelPlaza, retry: false })
  const models = (data as unknown as { models?: { id: string; name: string }[] })?.models ?? []

  return (
    <Page>
      <PageHeader title="Model Plaza" description="Available models and groups." />
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={normalizeError(error).message} onRetry={() => refetch()} />
      ) : models.length === 0 ? (
        <EmptyState title="No models" description="Model plaza is empty." />
      ) : (
        <Section title="Models">
          <div className="grid gap-3 md:grid-cols-3">
            {models.map((m) => (
              <Card key={m.id} className="rounded-none"><CardHeader><CardTitle className="text-sm">{m.name || m.id}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{m.id}</CardContent></Card>
            ))}
          </div>
        </Section>
      )}
    </Page>
  )
}
