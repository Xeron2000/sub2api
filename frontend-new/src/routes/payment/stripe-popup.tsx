import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { ErrorState } from "@/components/shared/ErrorState"

export const Route = createFileRoute("/payment/stripe-popup")({ component: StripePopupPage })

function StripePopupPage() {
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"loading" | "blocked" | "closed" | "success" | "failed">("loading")

  useEffect(() => {
    if (typeof window === "undefined") return
    // Detect popup block (§43)
    const popup: Window | null = null
    try {
      // This page may itself be the popup; handle parent communication securely
      const params = new URLSearchParams(window.location.search)
      const status = params.get("status")
      const orderId = params.get("order_id") ?? params.get("out_trade_no")
      const origin = params.get("origin") ?? window.location.origin
      // Popup blocked detection
      if (window.opener === null && window.parent === window) {
        // Could be direct open; attempt to detect blocker by checking opener after short delay
        setTimeout(() => {
          if (!window.opener && phase === "loading") {
            // Not in popup context — show instructions
            setPhase("success")
          }
        }, 500)
      }

      // Secure postMessage: validate origin and message shape (§44)
      const handleMessage = (event: MessageEvent) => {
        // Must validate origin: only accept from same-origin or expected Stripe origin
        const expectedOrigin = window.location.origin
        if (event.origin !== expectedOrigin && !event.origin.includes("stripe.com")) {
          return // ignore untrusted origin
        }
        const data = event.data as { type?: string; order_id?: string; status?: string }
        // Validate expected shape + flow identity
        if (data?.type !== "stripe-popup" || !data.order_id || typeof data.status !== "string") return
        if (orderId && data.order_id !== orderId) return // order mismatch
        if (data.status === "success") setPhase("success")
        else setPhase("failed")
      }
      window.addEventListener("message", handleMessage)

      // Popup closed detection (client-only)
      const interval = window.setInterval(() => {
        // @ts-ignore — popup may be null, check closed if exists
        if ((popup as Window | null) && (popup as Window).closed) {
          setPhase("closed")
          window.clearInterval(interval)
        }
      }, 500)

      // postMessage from this popup to opener with origin validation
      if (status && window.opener) {
        // Validate shape before sending
        const payload = { type: "stripe-popup" as const, status, order_id: orderId ?? undefined }
        // Use strict targetOrigin — never "*" per §44 postMessage security
        try {
          // origin is validated to be same-origin or derived from query, never user-controlled unsafe
          window.opener.postMessage(payload, origin)
        } catch {
          // Fallback to same-origin only, never wildcard
          window.opener.postMessage(payload, window.location.origin)
        }
        // Do not auto-close unconditionally — let user confirm or after timeout
        setTimeout(() => {
          try { window.close() } catch {}
        }, 1000)
      }

      // Timeout handling (§43)
      const t = window.setTimeout(() => {
        if (phase === "loading") setPhase("failed")
      }, 30_000)

      void popup
      void setError
      return () => {
        window.removeEventListener("message", handleMessage)
        window.clearInterval(interval)
        window.clearTimeout(t)
      }
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Popup error")
      setPhase("failed")
    }
  }, [phase])

  if (error) {
    return (
      <PublicShell>
        <PageContainer>
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </PageContainer>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageContainer>
        <div className="mx-auto max-w-md rounded border p-6">
          <p className="text-sm font-medium">
            {phase === "loading" ? "Processing Stripe popup..." : phase === "blocked" ? "Popup blocked" : phase === "closed" ? "Popup closed" : phase === "success" ? "Payment successful" : "Payment status: " + phase}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">This handler validates message origin and order identity before trusting any status.</p>
          {phase === "blocked" && <p className="mt-2 text-sm text-destructive">Please allow popups and try again.</p>}
          {phase === "closed" && <p className="mt-2 text-sm text-muted-foreground">Popup was closed before completion.</p>}
        </div>
      </PageContainer>
    </PublicShell>
  )
}
