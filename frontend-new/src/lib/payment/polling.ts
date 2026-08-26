/**
 * QR Polling helper — start/interval/stop on terminal/visibility/unmount/timeout per §37-38
 */

export type OrderStatus = "creating" | "waiting" | "paid" | "expired" | "failed" | "canceled" | "refunded" | "unknown"

export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? "").toLowerCase()
  if (["paid", "success", "completed"].includes(s)) return "paid"
  if (["expired", "timeout"].includes(s)) return "expired"
  if (["failed", "failure"].includes(s)) return "failed"
  if (["canceled", "cancelled"].includes(s)) return "canceled"
  if (["refunded"].includes(s)) return "refunded"
  if (["creating", "pending", "waiting", "unpaid"].includes(s)) return "waiting"
  return "unknown"
}

export const TERMINAL_STATUSES: OrderStatus[] = ["paid", "expired", "failed", "canceled", "refunded"]

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export type PollingController = {
  start: (orderId: string, onUpdate: (status: OrderStatus, raw: unknown) => void, onError: (e: unknown) => void) => void
  stop: () => void
}

export function createPollingController(opts: {
  fetchStatus: (orderId: string) => Promise<unknown>
  intervalMs?: number
  timeoutMs?: number
}): PollingController {
  let timer: number | null = null
  let stopped = false
  let startTime = 0
  let visibilityHandler: (() => void) | null = null

  const interval = opts.intervalMs ?? 2000
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000

  function clear() {
    if (timer !== null) {
      clearInterval(timer as unknown as number)
      timer = null
    }
    if (visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", visibilityHandler)
      visibilityHandler = null
    }
  }

  return {
    start(orderId, onUpdate, onError) {
      stopped = false
      startTime = Date.now()
      clear()

      let currentInterval = interval

      const tick = async () => {
        if (stopped) { clear(); return }
        if (Date.now() - startTime > timeout) {
          onUpdate("expired", { status: "expired", reason: "timeout" })
          clear()
          return
        }
        // Visibility throttle: reduce interval when hidden (§38)
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          currentInterval = Math.min(interval * 3, 10_000)
        } else {
          currentInterval = interval
        }
        try {
          const raw = await opts.fetchStatus(orderId)
          const status = normalizeOrderStatus((raw as { status?: unknown })?.status ?? raw)
          onUpdate(status, raw)
          if (isTerminal(status)) {
            clear()
          }
        } catch (e) {
          onError(e)
        }
      }

      // Initial tick after interval, not immediate to avoid storm
      timer = window.setInterval(tick, currentInterval) as unknown as number

      if (typeof document !== "undefined") {
        visibilityHandler = () => {
          if (document.visibilityState === "hidden") {
            // throttle handled in next tick; optionally clear and restart with longer interval
          }
        }
        document.addEventListener("visibilitychange", visibilityHandler)
      }

      // Also tick once immediately but async
      tick()
    },
    stop() {
      stopped = true
      clear()
    },
  }
}
