import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { PageContainer } from "@/components/shared/PageContainer"

export const Route = createFileRoute("/payment/stripe-popup")({ component: StripePopupPage })

function StripePopupPage() {
  useEffect(() => {
    if (typeof window === "undefined") return
    // Client-only popup handling
    const params = new URLSearchParams(window.location.search)
    const status = params.get("status")
    if (status && window.opener) {
      window.opener.postMessage({ type: "stripe-popup", status }, "*")
      window.close()
    }
  }, [])

  return (
    <PageContainer>
      <p className="text-sm text-muted-foreground">Stripe popup — client-only, will close automatically.</p>
    </PageContainer>
  )
}
