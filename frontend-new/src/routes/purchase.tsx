import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react"
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
  const [creatingPlanId, setCreatingPlanId] = useState<number | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: queryKeys.purchase.plans(),
    queryFn: async ({ signal }) => {
      const { data } = await paymentAPI.getPlans({ signal })
      // Backend unit is source of truth — do not parseFloat/calc, display as returned (± currency)
      return (data as Array<{ id: number; name: string; price: number; currency?: string; description?: string }>) ?? []
    },
  })
  const createOrderMut = useMutation({
    mutationFn: async (planId: number) => {
      // Amount/currency sent exactly as plan provides; no client-side calc
      const { data } = await paymentAPI.createOrder({ plan_id: planId })
      return data as { order_id?: string; out_trade_no?: string; qrcode_url?: string; provider?: string; next_url?: string }
    },
    onSuccess: (data, planId) => {
      setCreatingPlanId(null)
      const orderId = data.order_id ?? data.out_trade_no
      // Route based on provider or default QR
      if (data.next_url) window.location.href = data.next_url
      else if (orderId) window.location.href = `/payment/qrcode?order_id=${encodeURIComponent(orderId)}`
      else window.location.href = `/payment/qrcode?plan=${planId}`
    },
    onError: (err) => {
      setCreatingPlanId(null)
      setCreateError(getAppErrorMessage(err))
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
                    <p className="text-2xl font-bold">{formatMoney(plan.price)}{plan.currency ? ` ${plan.currency}` : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("purchase.paymentNote") || "Payment provider flows are handled separately."}
                    </p>
                    {createError && creatingPlanId === plan.id && <p role="alert" className="mt-2 text-sm text-destructive">{createError}</p>}
                    <Button className="mt-4 w-full" disabled={creatingPlanId === plan.id || createOrderMut.isPending} aria-busy={creatingPlanId === plan.id} onClick={() => {
                      if (creatingPlanId !== null) return // double click guard §33
                      setCreateError(null)
                      setCreatingPlanId(plan.id)
                      createOrderMut.mutate(plan.id)
                    }}>
                      {creatingPlanId === plan.id ? "Creating order..." : t("purchase.purchase") || "Purchase"}
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
