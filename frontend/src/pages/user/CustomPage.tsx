import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function CustomPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["custom", id],
    queryFn: async () => {
      const res = await httpClient.get("/page/" + id)
      return res.data
    },
    enabled: !!id,
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  return <Page><PageHeader title={`Custom ${id}`} /><Section><div className="text-sm whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</div></Section></Page>
}
