import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query/keys"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatMoney } from "@/lib/format"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/purchase")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/purchase" } as Record<string, string> })
    }
  },
  component: PurchasePage,
})

function PurchasePage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.purchase.plans(),
    queryFn: async ({ signal }) => {
      const { data } = await paymentAPI.getPlans({ signal })
      return (data as Array<{ id: number; name: string; price: number; description?: string }>) ?? []
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="purchase.title" descriptionKey="purchase.description" />
        <div className="mt-6">
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : !query.data?.length ? (
            <EmptyState
              title={t("purchase.noPlans") || "No plans available"}
              description={t("purchase.noPlansDesc") || "Check back later for available plans."}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {query.data.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {plan.description && <CardDescription>{plan.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatMoney(plan.price)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("purchase.paymentNote") || "Payment provider flows are handled separately."}
                    </p>
                    <Button className="mt-4 w-full" onClick={() => (window.location.href = `/payment/qrcode?plan=${plan.id}`)}>
                      {t("purchase.purchase") || "Purchase"}
                    </Button>
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
