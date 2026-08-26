import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAuthStatus } from "@/lib/auth"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { getInternalBatchImageJobs } from "@/lib/api/batchImage"

export const Route = createFileRoute("/batch-image")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/docs/batch-image") throw redirect({ to: "/batch-image" })
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/batch-image" } as Record<string, string> })
    }
  },
  component: BatchImageGuide,
})

function BatchImageGuide() {
  useEffect(() => {
    if (getAuthStatus() === "anonymous" && typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/docs/batch-image") {
      if (window.location.pathname === "/batch-image") window.location.href = `/login?redirect=${encodeURIComponent("/batch-image")}`
    }
  }, [])

  const jobsQuery = useQuery({
    queryKey: queryKeys.batchImage.list({}),
    queryFn: ({ signal }) => getInternalBatchImageJobs({ signal }),
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
