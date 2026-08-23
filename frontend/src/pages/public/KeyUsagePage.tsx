import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getKeyUsage } from "@/api/public"
import { Page, PageHeader, Toolbar, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function KeyUsagePage() {
  const [key, setKey] = useState("")
  const [submitted, setSubmitted] = useState("")
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["key-usage", submitted],
    queryFn: () => getKeyUsage(submitted),
    enabled: !!submitted,
  })
  return (
    <Page>
      <PageHeader title="Key Usage" description="Lookup usage by API key." />
      <Toolbar>
        <Input placeholder="sk-..." value={key} onChange={(e) => setKey(e.target.value)} className="max-w-md" />
        <Button onClick={() => setSubmitted(key)} disabled={!key}>Lookup</Button>
      </Toolbar>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {submitted && !isLoading && !error && (
        <Section><Card className="rounded-none"><CardContent className="p-4 text-sm whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</CardContent></Card></Section>
      )}
    </Page>
  )
}
