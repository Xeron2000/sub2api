/**
 * Stripe thin adapter — client-only boundary, testable, no secret key.
 * Publishable key only. Dynamic import to avoid SSR crash.
 */

export type StripeAdapter = {
  load: (publishableKey: string) => Promise<unknown>
  createElement?: (type: string, opts?: unknown) => unknown
  confirmPayment?: (opts: unknown) => Promise<{ error?: unknown; paymentIntent?: unknown }>
  destroy?: () => void
}

let stripeInstance: unknown = null
let stripePromise: Promise<unknown> | null = null

export function isStripeSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

export async function loadStripe(publishableKey: string): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("Stripe is client-only")
  if (!publishableKey) throw new Error("Missing Stripe publishable key")
  if (publishableKey.startsWith("sk_")) throw new Error("Secret key must not be used in frontend")
  if (stripePromise) return stripePromise
  stripePromise = (async () => {
    // Use dynamic import; fallback to script loader if not installed
    try {
      const mod = (await import("@stripe/stripe-js" as string)) as unknown as { loadStripe?: (key: string) => unknown }
      if (mod?.loadStripe) {
        const inst = await mod.loadStripe(publishableKey)
        stripeInstance = inst
        return inst
      }
    } catch {}
    // Fallback: load via CDN script
    await loadStripeScript()
    const w = window as unknown as { Stripe?: (key: string) => unknown }
    if (w.Stripe) {
      const inst = w.Stripe(publishableKey)
      stripeInstance = inst
      return inst
    }
    throw new Error("Stripe SDK failed to load")
  })()
  return stripePromise
}

function loadStripeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("No document"))
    if (document.querySelector('script[data-stripe="true"]')) return resolve()
    const script = document.createElement("script")
    script.src = "https://js.stripe.com/v3/"
    script.async = true
    script.dataset.stripe = "true"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Stripe script"))
    document.head.appendChild(script)
  })
}

export function getStripeInstance(): unknown {
  return stripeInstance
}

export function cleanupStripe(): void {
  stripeInstance = null
  stripePromise = null
  if (typeof document !== "undefined") {
    const el = document.querySelector('script[data-stripe="true"]')
    if (el) el.remove()
  }
}

// Mock-friendly adapter for tests / E2E without real Stripe
export function createStripeMock(): StripeAdapter {
  return {
    load: async () => ({ mock: true }),
    destroy: () => {},
  }
}
