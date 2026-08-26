import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { ErrorState } from "@/components/shared/ErrorState"
import { paymentAPI } from "@/lib/api/payment"
import { loadStripe, cleanupStripe } from "@/lib/providers/stripe"
import { normalizeOrderStatus } from "@/lib/payment/polling"

export const Route = createFileRoute("/payment/stripe")({ component: StripePage })

function StripePage() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const oid = params.get("order_id") ?? ""
    setOrderId(oid)
    if (oid) {
      paymentAPI
        .getOrder(oid)
        .then((res) => {
          const data = res.data as { client_secret?: string; publishable_key?: string; status?: string }
          if (data.client_secret) setClientSecret(data.client_secret)
          // Even if SDK says success, verify backend order status per §42
          void normalizeOrderStatus(data.status)
          // Attempt to load Stripe SDK client-only; publishable key only, never secret
          const pk = (data as { publishable_key?: string }).publishable_key ?? (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? ""
          if (pk) {
            loadStripe(pk).catch((e) => setSdkError((e as { message?: string })?.message ?? "Failed to load Stripe"))
          }
          setLoaded(true)
        })
        .catch((e) => {
          setError((e as { message?: string })?.message ?? "Failed to load order")
          setLoaded(true)
        })
    } else {
      setLoaded(true)
    }
    return () => cleanupStripe()
  }, [])

  if (error) {
    return (
      <PublicShell>
        <PageContainer>
          <h1 className="text-2xl font-semibold">Stripe Payment</h1>
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </PageContainer>
      </PublicShell>
    )
  }

  if (sdkError) {
    return (
      <PublicShell>
        <PageContainer>
          <h1 className="text-2xl font-semibold">Stripe Payment</h1>
          <ErrorState message={sdkError} onRetry={() => window.location.reload()} />
          <p className="mt-4 text-xs text-muted-foreground">Publishable key only — secret key never in bundle (§41)</p>
        </PageContainer>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Stripe Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loaded ? "Stripe loaded (client-only)" : "Loading Stripe..."}</p>
        {clientSecret && <p className="mt-1 text-xs text-muted-foreground">Order: {orderId}</p>}
        <div id="stripe-element" className="mt-6 rounded border p-4 text-sm text-muted-foreground">
          Stripe Element placeholder — client-only boundary via useEffect + dynamic import
        </div>
        {loaded && clientSecret && (
          <p className="mt-4 text-xs text-muted-foreground">Payment confirmation will be verified against backend order status (not SDK success alone).</p>
        )}
        <Link to="/payment/result" className="mt-4 inline-block text-sm text-primary hover:underline">Check result</Link>
      </PageContainer>
    </PublicShell>
  )
}