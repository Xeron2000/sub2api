import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/auth/dingtalk/email-completion")({ component: DingTalkEmail })

function DingTalkEmail() {
  const [status, setStatus] = useState("Completing DingTalk email binding...")
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const code = p.get("code")
    if (!code) return setStatus("Missing code")
    apiClient
      .get("/auth/dingtalk/email-completion", { params: { code } })
      .then(() => {
        setStatus("Email bound")
        window.location.href = "/dashboard"
      })
      .catch((e: unknown) => setStatus((e as { message?: string })?.message ?? "Failed"))
  }, [])
  return <div className="p-8 text-sm">{status}</div>
}
