import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/purchase")({ component: PurchasePage })

function PurchasePage() {
  const query = useQuery({
    queryKey: ["purchase", "plans"],
    queryFn: async () => {
      const { data } = await paymentAPI.getPlans()
      return data as unknown as Array<{ id: number; name: string; price: number }>
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="purchase.title" descriptionKey="purchase.description" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading plans...</p>
          ) : query.data?.length ? (
            query.data.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${plan.price.toFixed(2)}</p>
                  <Button className="mt-4 w-full" onClick={() => (window.location.href = `/payment/qrcode?plan=${plan.id}`)}>
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No plans available.</p>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
