import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/batch-image")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/docs/batch-image") throw redirect({ to: "/batch-image" })
  },
  component: BatchImageGuide,
})

function BatchImageGuide() {
  const jobsQuery = useQuery({
    queryKey: queryKeys.batchImage.list({}),
    queryFn: async () => {
      const { data } = await apiClient.get("/batch-image/jobs").catch(() => ({ data: { items: [] } }))
      return data as { items: Array<{ id: string; status: string }> }
    },
    enabled: typeof window !== "undefined" && !!localStorage.getItem("auth_token"),
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="batchImageGuide.title" descriptionKey="batchImageGuide.description" />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Batch image generation via Gemini — create jobs with prompts, poll status, download ZIP.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Select a Gemini API key with batch_image_generation enabled.</li>
              <li>Create a job with prompts and model; query via queryKeys.batchImage.</li>
              <li>Alias /docs/batch-image redirects here.</li>
            </ul>
            <pre className="rounded bg-muted p-3 text-xs">queryKeys.batchImage.list() / getBatchImageJob() — {jobsQuery.data?.items?.length ?? 0} jobs</pre>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  )
}
