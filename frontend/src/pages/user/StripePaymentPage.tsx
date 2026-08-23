import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"

export function StripePaymentPage() {
  const [params] = useSearchParams()
  const orderId = params.get("order_id") || params.get("out_trade_no") || ""
  const { data } = useQuery({
    queryKey: ["payment-stripepayment", orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await httpClient.get("/payment/orders/" + orderId)
      return res.data
    },
    enabled: !!orderId,
    refetchInterval: (q) => (q.state.data ? false : 3000),
  })
  return (
    <Page>
      <PageHeader title="StripePayment" description="Payment flow page." />
      <Section><Card className="rounded-none"><CardContent className="p-6 text-sm whitespace-pre-wrap">{orderId ? JSON.stringify(data, null, 2) : "No order — waiting for provider callback. Status is backend-authoritative."}</CardContent></Card></Section>
    </Page>
  )
}
