import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function LegalDocumentPage() {
  const { documentId } = useParams()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["legal", documentId],
    queryFn: async () => {
      const res = await httpClient.get<string>(`/legal/${documentId}`)
      return res.data as unknown as string
    },
    enabled: !!documentId,
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  return (
    <Page>
      <PageHeader title={`Legal — ${documentId}`} />
      <Section><div className="prose max-w-none text-sm whitespace-pre-wrap">{String(data ?? "No content")}</div></Section>
    </Page>
  )
}
