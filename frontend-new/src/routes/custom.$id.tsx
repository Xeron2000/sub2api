import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/custom/$id")({ component: CustomPage })

function CustomPage() {
  const { id } = Route.useParams()

  const query = useQuery({
    queryKey: ["custom", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pages/${encodeURIComponent(id)}`)
      return data as { title: string; content: string; url?: string }
    },
    retry: false,
  })

  if (query.isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </AppShell>
    )
  }

  if (query.isError) {
    return (
      <AppShell>
        <PageContainer>
          <ErrorState message={(query.error as { message?: string })?.message ?? "Failed to load custom page"} onRetry={() => query.refetch()} />
        </PageContainer>
      </AppShell>
    )
  }

  if (query.data?.url) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)]">
          <iframe src={query.data.url} className="h-full w-full border-0" title={query.data.title} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">{query.data?.title ?? `Custom ${id}`}</h1>
        <div className="prose prose-sm mt-4 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: query.data?.content ?? "<p>No content</p>" }} />
      </PageContainer>
    </AppShell>
  )
}
