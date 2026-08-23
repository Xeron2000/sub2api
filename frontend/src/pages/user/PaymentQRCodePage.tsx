import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Badge } from "@/components/ui/badge"

export function PaymentQRCodePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const orderId = params.get("order_id") || params.get("out_trade_no") || ""
  const { data, isLoading } = useQuery({
    queryKey: ["payment-qrcode", orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await httpClient.get("/payment/orders/" + orderId)
      return res.data as { status: string; qr_code?: string; pay_url?: string; amount?: number }
    },
    enabled: !!orderId,
    refetchInterval: (q) => {
      const s = (q.state.data as { status?: string } | null)?.status
      return s === "pending" || s === "created" ? 3000 : false
    },
  })
  if (!orderId) return <Page><PageHeader title="Payment" description="No order." /><Section><Card className="rounded-none"><CardContent className="p-6 text-sm">Missing order_id. Create an order via <a href="/purchase" className="underline">Purchase</a>.</CardContent></Card></Section></Page>
  const status = (data as { status?: string })?.status ?? "loading"
  if (status === "paid" || status === "success") {
    return <Page><PageHeader title="Payment Success" description="Order paid." /><Section><Card className="rounded-none"><CardContent className="p-6 text-center"><Badge>Paid</Badge><p className="mt-2 text-sm">Order {orderId} completed.</p><Button className="mt-4" onClick={() => navigate("/orders")}>View Orders</Button></CardContent></Card></Section></Page>
  }
  return (
    <Page>
      <PageHeader title="Payment QR Code" description={`Order ${orderId} — polling /payment/orders/:id every 3s.`} />
      <Section>
        <Card className="rounded-none max-w-md mx-auto"><CardContent className="p-6 text-center space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading order...</p> : (data as { qr_code?: string })?.qr_code ? <img src={(data as { qr_code: string }).qr_code} alt="QR" className="w-64 h-64 mx-auto border" /> : <p className="text-sm text-muted-foreground">Waiting for QR code... Status: <Badge variant="outline">{status}</Badge></p>}
          <p className="text-xs text-muted-foreground">Status is backend-authoritative. WeChat / Alipay / Stripe / Airwallex all report via webhook to /payment/callback/*.</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
            <Button onClick={() => navigate("/payment/result?order_id=" + orderId)}>Check Result</Button>
          </div>
        </CardContent></Card>
      </Section>
    </Page>
  )
}
