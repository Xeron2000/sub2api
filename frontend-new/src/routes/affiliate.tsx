import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageSection } from "@/components/shared/PageSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/affiliate")({ component: AffiliatePage })

function AffiliatePage() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ["affiliate", "detail"],
    queryFn: async () => {
      const { data } = await apiClient.get("/user/affiliate/detail")
      return data as { aff_code: string; aff_count: number; aff_quota: number; aff_history_quota: number; effective_rebate_rate_percent: number }
    },
  })

  const transfer = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/user/affiliate/transfer")
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate"] }),
  })

  const inviteLink = typeof window !== "undefined" && query.data?.aff_code ? `${window.location.origin}/register?aff=${encodeURIComponent(query.data.aff_code)}` : ""

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="affiliate.title" descriptionKey="affiliate.description" />
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Rebate Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{query.data?.effective_rebate_rate_percent ?? 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Invited Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{query.data?.aff_count ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Available Quota</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">${(query.data?.aff_quota ?? 0).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <PageSection titleKey="affiliate.inviteCodeTitle">
            <div className="flex gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-sm">{query.data?.aff_code ?? "-"}</code>
              <Button variant="outline" onClick={() => query.data?.aff_code && navigator.clipboard.writeText(query.data.aff_code)}>
                Copy
              </Button>
            </div>
            {inviteLink && (
              <div className="mt-3 flex gap-2">
                <code className="flex-1 truncate rounded border bg-muted px-3 py-2 text-sm">{inviteLink}</code>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                  Copy Link
                </Button>
              </div>
            )}
          </PageSection>

          <PageSection titleKey="affiliate.transferTitle" descriptionKey="affiliate.transferDesc">
            <Button onClick={() => transfer.mutate()} disabled={transfer.isPending || (query.data?.aff_quota ?? 0) <= 0}>
              {transfer.isPending ? "Transferring..." : "Transfer to Balance"}
            </Button>
          </PageSection>
        </div>
      </PageContainer>
    </AppShell>
  )
}
