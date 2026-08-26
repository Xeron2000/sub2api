import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/auth/wechat/callback")({ component: WechatCallback })

function WechatCallback() {
  const [status, setStatus] = useState("Processing WeChat callback...")
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const code = p.get("code")
    const state = p.get("state")
    if (!code) return setStatus("Missing code")
    apiClient
      .get("/auth/wechat/callback", { params: { code, state } })
      .then(() => {
        setStatus("Success")
        window.location.href = "/dashboard"
      })
      .catch((e: unknown) => setStatus((e as { message?: string })?.message ?? "Failed"))
  }, [])
  return <div className="p-8 text-sm">{status}</div>
}
