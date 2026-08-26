import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/payment/stripe")({ component: StripePage })

function StripePage() {
  const [loaded, setLoaded] = useState(false)
  const [_clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    // Client-only via useEffect + typeof window; fetch order client_secret via paymentAPI
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get("order_id") ?? ""
    if (orderId) {
      paymentAPI
        .getOrder(orderId)
        .then((res) => {
          const data = res.data as unknown as { client_secret?: string }
          if (data.client_secret) setClientSecret(data.client_secret)
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [])

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Stripe Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loaded ? "Stripe loaded (client-only)" : "Loading Stripe..."}</p>
        <div id="stripe-element" className="mt-6 rounded border p-4 text-sm text-muted-foreground">
          Stripe Element placeholder — client-only boundary via useEffect + dynamic import
        </div>
      </PageContainer>
    </PublicShell>
  )
}
