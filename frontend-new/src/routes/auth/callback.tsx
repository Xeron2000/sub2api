import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/auth/callback")({ component: OAuthCallback })

function OAuthCallback() {
  const [status, setStatus] = useState("Processing OAuth callback...")
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    if (!code) {
      setStatus("Missing code")
      return
    }
    apiClient
      .get("/auth/oauth/callback", { params: { code, state } })
      .then(() => {
        setStatus("OAuth success, redirecting...")
        window.location.href = "/dashboard"
      })
      .catch((e: unknown) => {
        const msg = (e as { message?: string })?.message ?? "OAuth failed"
        setStatus(msg)
      })
  }, [])
  return <div className="p-8 text-sm">{status}</div>
}
