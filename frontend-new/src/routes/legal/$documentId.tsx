import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PublicShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/legal/$documentId")({ component: LegalPage })

function LegalPage() {
  const { documentId } = Route.useParams()

  const query = useQuery({
    queryKey: ["legal", documentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/legal/${documentId}`)
      return data as { title: string; content: string }
    },
    retry: false,
  })

  if (query.isLoading) {
    return (
      <PublicShell>
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </PublicShell>
    )
  }

  if (query.isError) {
    return (
      <PublicShell>
        <PageContainer>
          <ErrorState message={(query.error as { message?: string })?.message ?? "Failed to load document"} onRetry={() => query.refetch()} />
        </PageContainer>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">{query.data?.title ?? documentId}</h1>
        <div className="prose prose-sm mt-4 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: query.data?.content ?? "<p>No content</p>" }} />
      </PageContainer>
    </PublicShell>
  )
}
