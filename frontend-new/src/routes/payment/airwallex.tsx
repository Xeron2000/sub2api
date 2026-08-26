import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { ErrorState } from "@/components/shared/ErrorState"
import { paymentAPI } from "@/lib/api/payment"
import { loadAirwallex, cleanupAirwallex } from "@/lib/providers/airwallex"

export const Route = createFileRoute("/payment/airwallex")({ component: AirwallexPage })

function AirwallexPage() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const oid = params.get("order_id") ?? ""
    setOrderId(oid)
    if (oid) {
      paymentAPI
        .getOrder(oid)
        .then(() => {
          // Load SDK client-only; cleanup on unmount (§45-46)
          loadAirwallex()
            .then(() => setLoaded(true))
            .catch((e) => {
              setError((e as { message?: string })?.message ?? "Failed to load Airwallex SDK")
              setLoaded(true)
            })
        })
        .catch((e) => {
          setError((e as { message?: string })?.message ?? "Failed to load order")
          setLoaded(true)
        })
    } else {
      setLoaded(true)
    }
    return () => cleanupAirwallex("airwallex-element")
  }, [])

  if (error) {
    return (
      <PublicShell>
        <PageContainer>
          <h1 className="text-2xl font-semibold">Airwallex Payment</h1>
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </PageContainer>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Airwallex Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loaded ? "Airwallex loaded (client-only)" : "Loading Airwallex..."}</p>
        {orderId && <p className="text-xs text-muted-foreground">Order: {orderId}</p>}
        <div id="airwallex-element" className="mt-6 rounded border p-4 text-sm text-muted-foreground">Airwallex placeholder — client-only via useEffect, window/document guarded</div>
      </PageContainer>
    </PublicShell>
  )
}
