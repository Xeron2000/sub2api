import { redirect } from "@tanstack/react-router"
import { getAuthStatus, isAdmin, getIsSimpleMode } from "@/lib/auth"

export type GuardOptions = {
  requirePayment?: boolean
  requireRiskControl?: boolean
  blockSimpleMode?: boolean
  simpleModeRedirect?: string
}

/**
 * Unified admin beforeLoad guard — replaces per-page JSON.parse(localStorage) hacks.
 * Enforces: unknown→allow (hydration), anonymous→login, non-admin→/dashboard, simpleMode→redirect,
 * plus optional feature flags (payment/risk) via cached localStorage (fail-open on unknown).
 * No direct localStorage JSON parsing in route files — central single source.
 */
export function createAdminGuard(options: GuardOptions = {}) {
  return () => {
    if (typeof window === "undefined") return
    const status = getAuthStatus()
    // three-state: unknown = SSR/hydration — don't flash redirect
    if (status === "unknown") return
    if (status === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: window.location.pathname } as Record<string, string> })
    }
    if (!isAdmin()) {
      throw redirect({ to: "/dashboard" })
    }
    if (options.blockSimpleMode) {
      if (getIsSimpleMode()) {
        throw redirect({ to: options.simpleModeRedirect ?? "/admin/dashboard" })
      }
    }
    // feature flags — read cached bool (set by settings fetch). Only block when explicitly false.
    if (options.requirePayment) {
      try {
        if (localStorage.getItem("payment_enabled_cached") === "false") {
          throw redirect({ to: "/admin/dashboard" })
        }
      } catch {}
    }
    if (options.requireRiskControl) {
      try {
        // risk_control_enabled not cached separately; checked via settings. Fallback to no block.
        // If explicitly cached false, block.
        if (localStorage.getItem("risk_control_enabled_cached") === "false") {
          throw redirect({ to: "/admin/settings" })
        }
      } catch {}
    }
  }
}

export const adminGuard = createAdminGuard()
export const simpleModeBlockedGuard = createAdminGuard({ blockSimpleMode: true })
export const paymentGuard = createAdminGuard({ requirePayment: true })
export const riskGuard = createAdminGuard({ requireRiskControl: true })
