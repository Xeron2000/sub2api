export type FeatureFlagKey = "payment_enabled_cached" | "risk_control_enabled_cached" | "ops_monitoring_enabled_cached"

export function cacheFeatureFlag(key: FeatureFlagKey, enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, enabled ? "true" : "false")
    // dispatch event so AppSidebar can react without reload (optional)
    window.dispatchEvent(new CustomEvent("feature-flag-changed", { detail: { key, enabled } }))
  } catch {}
}

export function cacheFeatureFlagsFromSettings(settings: Record<string, unknown> | null | undefined): void {
  if (!settings || typeof settings !== "object") return
  if (typeof settings.payment_enabled === "boolean") cacheFeatureFlag("payment_enabled_cached", Boolean(settings.payment_enabled))
  if (typeof settings.risk_control_enabled === "boolean") cacheFeatureFlag("risk_control_enabled_cached", Boolean(settings.risk_control_enabled))
  if (typeof settings.ops_monitoring_enabled === "boolean") cacheFeatureFlag("ops_monitoring_enabled_cached", Boolean(settings.ops_monitoring_enabled))
}

export function readFeatureFlag(key: FeatureFlagKey): boolean | null {
  if (typeof window === "undefined") return null
  try {
    const v = localStorage.getItem(key)
    if (v === "true") return true
    if (v === "false") return false
    return null
  } catch {
    return null
  }
}
