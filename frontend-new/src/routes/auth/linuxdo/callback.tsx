import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/auth/linuxdo/callback")({ component: LinuxDoCallback })

function LinuxDoCallback() {
  const [status, setStatus] = useState("Processing LinuxDo callback...")
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const code = p.get("code")
    const state = p.get("state")
    if (!code) return setStatus("Missing code")
    apiClient
      .get("/auth/linuxdo/callback", { params: { code, state } })
      .then(() => {
        setStatus("Success")
        window.location.href = "/dashboard"
      })
      .catch((e: unknown) => setStatus((e as { message?: string })?.message ?? "Failed"))
  }, [])
  return <div className="p-8 text-sm">{status}</div>
}
