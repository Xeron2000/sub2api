import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Button } from "@/components/ui/button"

export function RiskControlPage() {
  const { data } = useQuery({ queryKey: ["risk-config"], queryFn: async () => (await httpClient.get("/admin/risk-control/config")).data })
  return (
    <Page>
      <PageHeader title="Risk Control" description="Content moderation and flagged hashes." />
      <Section><Card className="rounded-none"><CardContent className="p-4 text-sm whitespace-pre-wrap">{JSON.stringify(data ?? {}, null, 2)}</CardContent></Card><Button variant="outline" className="mt-2">Test API keys</Button></Section>
    </Page>
  )
}
