import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"

export const Route = createFileRoute("/subscriptions")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("auth_user") || "null")
        if (user?.is_simple_mode) throw redirect({ to: "/dashboard" })
      } catch (e) {
        if ((e as { message?: string })?.message?.includes("redirect")) throw e
      }
    }
  },
  component: SubscriptionsPage,
})

function SubscriptionsPage() {
  const query = useQuery({
    queryKey: queryKeys.subscriptions.list(),
    queryFn: async () => {
      const { data } = await apiClient.get("/subscriptions")
      return data as Array<{ id: number; group?: { name: string }; status: string; daily_usage_usd: number; group_daily_limit?: number }>
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="userSubscriptions.title" />
        <div className="mt-6">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">Failed to load</p>
          ) : !query.data?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">No active subscriptions.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {query.data.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{sub.group?.name ?? `Group #${sub.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily</span>
                      <span>${(sub.daily_usage_usd ?? 0).toFixed(2)} / ${sub.group_daily_limit ?? "-"}</span>
                    </div>
                    <Progress value={sub.group_daily_limit ? Math.min(100, ((sub.daily_usage_usd ?? 0) / sub.group_daily_limit) * 100) : 0} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
