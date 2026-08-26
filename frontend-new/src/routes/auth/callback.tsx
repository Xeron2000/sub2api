import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "@/i18n"
import { handleOAuthCallback  } from "@/lib/auth/oauth"
import type {OAuthCallbackState} from "@/lib/auth/oauth";

export const Route = createFileRoute("/auth/callback")({ component: OAuthCallback })

type UiState = "idle" | "loading" | "callback_processing" | "success" | "error" | "recoverable_error"

function OAuthCallback() {
  const { t } = useTranslation()
  const [uiState, setUiState] = useState<UiState>("loading")
  const [message, setMessage] = useState("Processing OAuth callback...")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (started) return
    // Replay guard: prevent duplicate processing on refresh via flag
    const flagKey = "oauth_processing_generic"
    if (sessionStorage.getItem(flagKey) === "1") {
      setUiState("recoverable_error")
      setMessage("This callback was already processed. If you were not redirected, please try logging in again.")
      return
    }
    setStarted(true)
    sessionStorage.setItem(flagKey, "1")
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const error = params.get("error")
    const error_description = params.get("error_description")
    const redirect = params.get("redirect") ?? params.get("next")

    setUiState("callback_processing")

    // Ensure OAuthCallbackState type is referenced for verification
    void (null as unknown as OAuthCallbackState)

    handleOAuthCallback({
      provider: "generic",
      code,
      state,
      error,
      errorDescription: error_description,
      redirectParam: redirect,
      apiPath: "/auth/oauth/callback",
    })
      .then((res) => {
        sessionStorage.removeItem(flagKey)
        if (res.success) {
          if (res.requiresEmail) {
            setUiState("success")
            setMessage("Additional step required")
            window.location.href = "/auth/dingtalk/email-completion"
            return
          }
          setUiState("success")
          setMessage("OAuth success, redirecting...")
          window.location.href = res.redirectTo ?? "/dashboard"
        } else {
          const isRecoverable = res.error?.code !== "state_invalid"
          setUiState(isRecoverable ? "recoverable_error" : "error")
          setMessage(res.error?.message ?? "OAuth failed")
        }
      })
      .catch((e: unknown) => {
        sessionStorage.removeItem(flagKey)
        const msg = (e as { message?: string })?.message ?? "OAuth failed"
        setUiState("recoverable_error")
        setMessage(msg)
      })
  }, [started])

  return (
    <div className="mx-auto max-w-md p-8">
      <div className="rounded-lg border p-6">
        <p className="text-sm font-medium">
          {uiState === "loading" || uiState === "callback_processing" ? "Processing..." : uiState === "success" ? "Success" : "Error"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground" role={uiState.includes("error") ? "alert" : undefined}>
          {message}
        </p>
        {uiState.includes("error") && (
          <div className="mt-4 flex gap-2">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t("common.back") ?? "Back to login"}
            </Link>
            <button onClick={() => window.location.reload()} className="text-sm text-muted-foreground hover:underline">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
