import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { handleOAuthCallback } from "@/lib/auth/oauth"

export const Route = createFileRoute("/auth/oidc/callback")({ component: OidcCallback })

type UiState = "loading" | "callback_processing" | "success" | "error" | "recoverable_error"

function OidcCallback() {
  const [uiState, setUiState] = useState<UiState>("loading")
  const [message, setMessage] = useState("Processing OIDC callback...")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || started) return
    const flagKey = "oauth_processing_oidc"
    if (sessionStorage.getItem(flagKey) === "1") {
      setUiState("recoverable_error")
      setMessage("Callback already processed.")
      return
    }
    setStarted(true)
    sessionStorage.setItem(flagKey, "1")
    const params = new URLSearchParams(window.location.search)
    handleOAuthCallback({
      provider: "oidc",
      code: params.get("code"),
      state: params.get("state"),
      error: params.get("error"),
      errorDescription: params.get("error_description"),
      redirectParam: params.get("redirect") ?? params.get("next"),
      apiPath: "/auth/oauth/oidc/callback",
    })
      .then((res) => {
        sessionStorage.removeItem(flagKey)
        if (res.success) {
          setUiState("success")
          setMessage("Success, redirecting...")
          window.location.href = res.redirectTo ?? "/dashboard"
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
        {uiState.includes("error") && <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Back to login</Link>}
      </div>
    </div>
  )
}
