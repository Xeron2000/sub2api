import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/auth/wechat/payment/callback")({ component: WechatPayCallback })

function WechatPayCallback() {
  const [status, setStatus] = useState("Processing WeChat Pay callback...")
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const code = p.get("code")
    if (!code) return setStatus("Missing code")
    apiClient
      .get("/auth/wechat/payment/callback", { params: { code } })
      .then(() => {
        setStatus("Payment linked")
        window.location.href = "/profile"
      })
      .catch((e: unknown) => setStatus((e as { message?: string })?.message ?? "Failed"))
  }, [])
  return <div className="p-8 text-sm">{status}</div>
}
