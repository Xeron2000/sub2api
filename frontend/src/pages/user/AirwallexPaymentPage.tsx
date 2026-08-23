import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AirwallexPaymentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const orderId = params.get("order_id") || params.get("out_trade_no") || ""
  const { data, isLoading } = useQuery({
    queryKey: ["payment-airwallexpayment", orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await httpClient.get("/payment/orders/" + orderId)
      return res.data as { status: string; amount?: number; pay_url?: string }
    },
    enabled: !!orderId,
    refetchInterval: (q) => { // max 60 polls, stop on not pending
      const count = (q.state.dataUpdateCount ?? 0); if (count > 60) return false;
      const s = (q.state.data as { status?: string } | null)?.status
      return s === "pending" || s === "created" ? 3000 : false
    },
  })
  if (!orderId) return <Page><PageHeader title="AirwallexPayment" description="Payment flow — missing order." /><Section><Card className="rounded-none"><CardContent className="p-6 text-sm">No order_id. Start at <a href="/purchase" className="underline">Purchase</a>.</CardContent></Card></Section></Page>
  const status = (data as { status?: string })?.status ?? "loading"
  return (
    <Page>
      <PageHeader title="AirwallexPayment" description={`Order ${orderId} — backend-authoritative polling.`} />
      <Section>
        <Card className="rounded-none max-w-md mx-auto"><CardContent className="p-6 text-center space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : <><Badge variant="outline">{status}</Badge><p className="text-sm">Amount: {(data as { amount?: number })?.amount ?? "—"}</p></>}
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
            <Button onClick={() => navigate("/orders")}>Orders</Button>
          </div>
        </CardContent></Card>
      </Section>
    </Page>
  )
}
