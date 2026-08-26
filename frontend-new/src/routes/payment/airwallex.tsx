import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/payment/airwallex")({ component: AirwallexPage })

function AirwallexPage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    // Client-only via useEffect + typeof window; init via paymentAPI
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get("order_id") ?? ""
    if (orderId) {
      paymentAPI
        .getOrder(orderId)
        .then(() => setLoaded(true))
        .catch(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [])

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Airwallex Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loaded ? "Airwallex loaded (client-only)" : "Loading Airwallex..."}</p>
        <div className="mt-6 rounded border p-4 text-sm text-muted-foreground">Airwallex placeholder — client-only via useEffect</div>
      </PageContainer>
    </PublicShell>
  )
}
