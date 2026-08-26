/**
 * Airwallex thin adapter — client-only boundary.
 * Mount / payment / callback / cleanup / error handling isolated.
 */

export type AirwallexAdapter = {
  load: (opts?: unknown) => Promise<unknown>
  mount: (elementId: string, opts?: unknown) => void
  unmount?: () => void
  destroy?: () => void
  onSuccess?: (cb: (data: unknown) => void) => void
  onError?: (cb: (err: unknown) => void) => void
}

let instance: unknown = null
let loadPromise: Promise<unknown> | null = null

export function isAirwallexSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

export async function loadAirwallex(): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("Airwallex is client-only")
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      // Optional SDK — may not be installed; use script fallback
      const mod = (await import(/* @vite-ignore */ "@airwallex/components-sdk" as string).catch(() => null)) as unknown
      if (mod) {
        instance = mod
        return mod
      }
    } catch {}
    // Fallback: load via CDN
    await loadAirwallexScript()
    const w = window as unknown as { Airwallex?: unknown }
    if (w.Airwallex) {
      instance = w.Airwallex
      return w.Airwallex
    }
    throw new Error("Airwallex SDK failed to load")
  })()
  return loadPromise
}

function loadAirwallexScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("No document"))
    if (document.querySelector('script[data-airwallex="true"]')) return resolve()
    const script = document.createElement("script")
    script.src = "https://checkout.airwallex.com/assets/elements/bundle.js"
    script.async = true
    script.dataset.airwallex = "true"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Airwallex script"))
    document.head.appendChild(script)
  })
}

export function getAirwallexInstance(): unknown {
  return instance
}

export function cleanupAirwallex(elementId?: string): void {
  instance = null
  loadPromise = null
  if (elementId && typeof document !== "undefined") {
    const el = document.getElementById(elementId)
    if (el) el.innerHTML = ""
  }
  if (typeof document !== "undefined") {
    const s = document.querySelector('script[data-airwallex="true"]')
    if (s) s.remove()
  }
}

export function createAirwallexMock(): AirwallexAdapter {
  return {
    load: async () => ({ mock: true }),
    mount: () => {},
    destroy: () => {},
  }
}
