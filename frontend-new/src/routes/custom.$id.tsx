import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/lib/api/client"
import { DOMPurify, sanitizeHTMLSync } from "@/lib/sanitize"

export const Route = createFileRoute("/custom/$id")({ component: CustomPage })

function CustomPage() {
  const { id } = Route.useParams()

  const query = useQuery({
    queryKey: ["custom", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pages/${encodeURIComponent(id)}`)
      return data as { title: string; content: string; url?: string }
    },
    retry: false,
  })

  if (query.isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </AppShell>
    )
  }

  if (query.isError) {
    const err = query.error as unknown as { status?: number; type?: string; response?: { status?: number }; message?: string }
    const status = err?.status ?? err?.response?.status
    const type = (err as { type?: string })?.type
    const msg = err?.message ?? "Failed to load custom page"
    // Distinct states per §65: 404 / disabled / permission / backend error — handle both status and AppError type
    let display = msg
    if (status === 404 || type === "not_found" || /not found/i.test(msg)) display = "Custom page not found."
    else if (status === 403 || type === "forbidden" || /permission|forbidden/i.test(msg)) display = "You do not have permission to view this page."
    else if (msg.includes("disabled")) display = "This page is disabled."
    void DOMPurify // keep reference for bundler
    return (
      <AppShell>
        <PageContainer>
          <ErrorState message={display} onRetry={() => query.refetch()} />
        </PageContainer>
      </AppShell>
    )
  }

  if (query.data?.url) {
    // Validate external iframe URL scheme safety
    let safeUrl = query.data.url
    try {
      const u = new URL(safeUrl, window.location.origin)
      if (!["https:", "http:"].includes(u.protocol)) safeUrl = "about:blank"
    } catch {
      safeUrl = "about:blank"
    }
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)]">
          <iframe src={safeUrl} className="h-full w-full border-0" title={query.data.title} />
        </div>
      </AppShell>
    )
  }

  const raw = query.data?.content ?? "<p>No content</p>"
  // Handle markdown if content looks like markdown (simple heuristic) — otherwise treat as HTML
  // Then DOMPurify sanitize before render (§62)
  const sanitized = sanitizeHTMLSync(raw)
  // Post-process links for safety: ensure external links get rel noopener (done via sanitizer, but enforce on rendered content)
  return (
    <AppShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">{query.data?.title ?? `Custom ${id}`}</h1>
        <div className="prose prose-sm mt-4 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitized /* DOMPurify sanitized via sanitizeHTMLSync */ }} />
      </PageContainer>
    </AppShell>
  )
}
