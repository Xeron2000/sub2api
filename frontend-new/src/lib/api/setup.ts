import { apiClient } from "./client"
import { buildGatewayUrl } from "./url"

export type SetupStatus = { needs_setup: boolean; step?: string }

export async function getSetupStatus(opts?: { signal?: AbortSignal }): Promise<SetupStatus> {
  // Try primary endpoint via apiClient (proxied), fallback to gateway url
  try {
    const { data } = await apiClient.get("/setup/status", { signal: opts?.signal })
    // data may be wrapped as { data: { needs_setup } } or direct
    const inner = (data as { data?: SetupStatus })?.data ?? data
    return inner as SetupStatus
  } catch {
    // Fallback via fetch to gateway (for direct loads without proxy)
    if (typeof window !== "undefined") {
      try {
        const url = buildGatewayUrl("/setup/status")
        const res = await fetch(url, { signal: opts?.signal })
        const json = (await res.json()) as { data?: SetupStatus } & SetupStatus
        return (json.data ?? json) as SetupStatus
      } catch {}
    }
    throw new Error("Failed to fetch setup status")
  }
}

export type InstallPayload = {
  database?: unknown
  redis?: unknown
  admin?: { email: string; password: string }
  server?: unknown
}

export async function installSetup(payload: InstallPayload): Promise<unknown> {
  const { data } = await apiClient.post("/setup/install", payload)
  return (data as { data?: unknown })?.data ?? data
}
