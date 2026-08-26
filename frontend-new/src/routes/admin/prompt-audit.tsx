import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/prompt-audit")({ component: PromptAuditPage })

function PromptAuditPage() {
  const query = useQuery({
    queryKey: ["admin", "prompt-audit"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/prompt-audit")
      return data as { items: Array<{ id: number; prompt: string; status: string }> }
    },
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.promptAudit.title" />
        <div className="mt-6">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Found {query.data?.items?.length ?? 0} items.</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {(query.data?.items ?? []).slice(0, 5).map((it) => (
                    <li key={it.id}>
                      {it.prompt.slice(0, 80)} — {it.status}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </AdminShell>
  )
}
