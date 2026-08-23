import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"

export function PromptAuditPage() {
  const { data } = useQuery({ queryKey: ["prompt-audit"], queryFn: async () => (await httpClient.get("/admin/prompt-audit/config")).data })
  return (
    <Page>
      <PageHeader title="Prompt Audit" description="Policy and events." />
      <Section><Card className="rounded-none"><CardContent className="p-4 text-sm whitespace-pre-wrap">{JSON.stringify(data ?? {}, null, 2)}</CardContent></Card></Section>
    </Page>
  )
}
