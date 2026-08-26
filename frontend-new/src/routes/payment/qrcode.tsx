import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { paymentAPI } from "@/lib/api/payment"
import { createPollingController, normalizeOrderStatus, isTerminal  } from "@/lib/payment/polling"
import type {OrderStatus} from "@/lib/payment/polling";
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/payment/qrcode")({ component: QRCodePage })

function QRCodePage() {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [status, setStatus] = useState<OrderStatus>("creating")
  const controllerRef = useRef<ReturnType<typeof createPollingController> | null>(null)
  const query = useQuery({
    queryKey: ["payment", "qrcode"],
    queryFn: async () => {
      const { data } = await paymentAPI.getCheckoutInfo()
      const d = data as { qrcode_url?: string; url?: string; order_id?: string; out_trade_no?: string }
      const id = d.order_id ?? d.out_trade_no ?? new URLSearchParams(window.location.search).get("order_id") ?? null
      if (id) setOrderId(id)
      return { url: d.qrcode_url ?? d.url ?? "" }
    },
  })

  useEffect(() => {
    // Also pick orderId from URL if not from checkout-info
    if (!orderId && typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search)
      const id = p.get("order_id") ?? p.get("out_trade_no")
      if (id) setOrderId(id)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId) return
    const ctrl = createPollingController({
      fetchStatus: async (id) => {
        const { data } = await paymentAPI.getOrder(id)
        return data
      },
      intervalMs: 2000,
      timeoutMs: 5 * 60 * 1000,
    })
    controllerRef.current = ctrl
    ctrl.start(
      orderId,
      (s, raw) => {
        setStatus(s)
        if (s === "paid") {
          toast.success("Payment successful")
        }
        void raw
      },
      () => {
        // polling error is recoverable — keep polling until timeout/terminal
      },
    )
    return () => ctrl.stop()
  }, [orderId])

  // Stop on unmount handled via effect cleanup; also stop when terminal
  useEffect(() => {
    if (isTerminal(status) && controllerRef.current) {
      controllerRef.current.stop()
    }
  }, [status])

  const statusLabel: Record<OrderStatus, string> = {
    creating: "Creating...",
    waiting: "Waiting for payment",
    paid: "Paid",
    expired: "Expired",
    failed: "Failed",
    canceled: "Canceled",
    refunded: "Refunded",
    unknown: "Unknown",
  }

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-base">Scan to Pay</CardTitle>
            <p className="text-xs text-muted-foreground">{statusLabel[normalizeOrderStatus(status)]}</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {query.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading QR...</p>
            ) : status === "paid" ? (
              <p className="text-sm text-green-600">Payment confirmed. Redirecting...</p>
            ) : status === "expired" ? (
              <div className="text-center">
                <p className="text-sm text-destructive">QR code expired</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
                  Retry
                </Button>
              </div>
            ) : status === "failed" || status === "canceled" ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{status === "failed" ? "Payment failed" : "Payment canceled"}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            ) : query.data?.url ? (
              <img src={query.data.url} alt="QR Code" className="h-64 w-64 border rounded" />
            ) : (
              <p className="text-sm text-muted-foreground">No QR code</p>
            )}
            {orderId && <p className="text-xs text-muted-foreground">Order: {orderId}</p>}
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  )
}