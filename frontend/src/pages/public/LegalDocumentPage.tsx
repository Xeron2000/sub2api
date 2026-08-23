import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { LoadingState } from "@/components/shared/EmptyState"

export function LegalDocumentPage() {
  const { documentId } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ["legal-settings"],
    queryFn: async () => {
      const res = await httpClient.get<{ login_agreement_documents?: { id: string; title: string; content_md: string }[] }>("/settings/public")
      return res.data
    },
  })

  const doc = (data?.login_agreement_documents ?? []).find(d => d.id === documentId)
  const title = doc?.title || `Legal Terms (${documentId})`
  const content = doc?.content_md || `Standard terms and conditions for ${documentId}.`

  return (
    <Page>
      <PageHeader title={title} description="Terms of service and legal agreement." />
      <Section>
        {isLoading ? <LoadingState /> : (
          <div className="prose max-w-none text-sm whitespace-pre-wrap bg-card p-6 border rounded-none">
            {content}
          </div>
        )}
      </Section>
    </Page>
  )
}
