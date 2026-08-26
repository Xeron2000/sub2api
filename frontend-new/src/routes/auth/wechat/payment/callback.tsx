import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { handleOAuthCallback } from "@/lib/auth/oauth"

export const Route = createFileRoute("/auth/wechat/payment/callback")({ component: WechatPayCallback })

type UiState = "loading" | "callback_processing" | "success" | "error" | "recoverable_error"

function WechatPayCallback() {
  const [uiState, setUiState] = useState<UiState>("loading")
  const [message, setMessage] = useState("Processing WeChat payment callback...")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || started) return
    // This endpoint is classified as payment (not auth) per §49 — verify backend contract
    const flagKey = "oauth_processing_wechat_payment"
    if (sessionStorage.getItem(flagKey) === "1") {
      setUiState("recoverable_error")
      setMessage("Callback already processed.")
      return
    }
    setStarted(true)
    sessionStorage.setItem(flagKey, "1")
    const params = new URLSearchParams(window.location.search)
    // First try generic OAuth handler for consistency (handles error/state/sensitive cleanup)
    // If backend treats this as payment verification, fallback to direct payment verification
    const code = params.get("code")
    const state = params.get("state")
    const orderId = params.get("order_id") ?? params.get("out_trade_no")
    if (orderId) {
      apiClient
        .post("/payment/orders/verify", { out_trade_no: orderId })
        .then(() => {
          sessionStorage.removeItem(flagKey)
          setUiState("success")
          setMessage("Payment verified")
          window.location.href = "/payment/result?order_id=" + encodeURIComponent(orderId)
        })
        .catch((e: unknown) => {
          sessionStorage.removeItem(flagKey)
          setUiState("recoverable_error")
          setMessage((e as { message?: string })?.message ?? "Payment verification failed")
        })
      return
    }
    handleOAuthCallback({
      provider: "wechat",
      code,
      state,
      error: params.get("error"),
      errorDescription: params.get("error_description"),
      redirectParam: params.get("redirect") ?? params.get("next"),
      apiPath: "/auth/wechat/payment/callback",
    })
      .then((res) => {
        sessionStorage.removeItem(flagKey)
        if (res.success) {
          setUiState("success")
          setMessage("Payment linked")
          window.location.href = res.redirectTo ?? "/payment/result"
        } else {
          setUiState("error")
          setMessage(res.error?.message ?? "Failed")
        }
      })
      .catch((e: unknown) => {
        sessionStorage.removeItem(flagKey)
        setUiState("recoverable_error")
        setMessage((e as { message?: string })?.message ?? "Failed")
      })
  }, [started])

  return (
    <div className="mx-auto max-w-md p-8">
      <div className="rounded-lg border p-6">
        <p className="text-sm font-medium">{uiState.includes("error") ? "Error" : uiState === "success" ? "Success" : "Processing..."}</p>
        <p className="mt-2 text-sm text-muted-foreground" role={uiState.includes("error") ? "alert" : undefined}>{message}</p>
        {uiState.includes("error") && <Link to="/payment/result" className="mt-4 inline-block text-sm text-primary hover:underline">Check payment result</Link>}
      </div>
    </div>
  )
}
