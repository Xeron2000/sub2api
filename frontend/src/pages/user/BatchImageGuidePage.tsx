import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BatchImageGuidePage() {
  return (
    <Page>
      <PageHeader title="Batch Image Guide" description="Async image generation batch workflow." />
      <Section><Card className="rounded-none"><CardHeader><CardTitle>Guide</CardTitle></CardHeader><CardContent className="text-sm">Submit via POST /v1/images/batches, poll GET /v1/images/batches/:id, download outputs. Backend docs in ASYNC_IMAGE_TASKS.md.</CardContent></Card></Section>
    </Page>
  )
}
