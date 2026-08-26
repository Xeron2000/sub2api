import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/payment/result")({ component: PaymentResultPage })

function PaymentResultPage() {
  const query = useQuery({
    queryKey: ["payment", "result"],
    queryFn: async () => {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
      const orderId = params.get("order_id") ?? params.get("out_trade_no") ?? ""
      if (!orderId) return { status: "unknown", message: "No order" } as { status: string; message: string }
      const { data } = await paymentAPI.verifyOrder(orderId).catch(() => paymentAPI.verifyOrderPublic(orderId))
      return data as unknown as { status: string; message: string }
    },
    enabled: typeof window !== "undefined",
  })

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Payment Result</h1>
        {query.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking...</p>
        ) : (
          <p className="mt-4 text-sm">{query.data?.message ?? query.data?.status ?? "Done"}</p>
        )}
      </PageContainer>
    </PublicShell>
  )
}
