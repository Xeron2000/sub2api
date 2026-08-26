import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { completeOAuthLogin, safeRedirect } from "@/lib/auth/oauth"

export const Route = createFileRoute("/auth/dingtalk/email-completion")({ component: DingTalkEmailCompletion })

const schema = z.object({ email: z.string().email("Invalid email") })
type FormData = z.infer<typeof schema>

type UiState = "idle" | "loading" | "success" | "error" | "expired" | "recoverable_error"

function DingTalkEmailCompletion() {
  const [uiState, setUiState] = useState<UiState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  useEffect(() => {
    if (typeof window === "undefined") return
    // Load pending token from sessionStorage (set by dingtalk callback) or query
    const params = new URLSearchParams(window.location.search)
    const tokenFromQuery = params.get("pending_token") ?? params.get("token")
    const tokenFromStorage = (() => {
      try { return window.sessionStorage.getItem("pending_oauth_token") } catch { return null }
    })()
    const token = tokenFromQuery ?? tokenFromStorage
    if (!token) {
      setUiState("expired")
      setMessage("Session expired or missing. Please start DingTalk login again.")
      return
    }
    setPendingToken(token)
    // Cross-tab: persist in sessionStorage for refresh/new-tab safety (§20)
    try { window.sessionStorage.setItem("pending_oauth_token", token) } catch {}
  }, [])

  const onSubmit = async (data: FormData) => {
    if (!pendingToken) return
    setUiState("loading")
    setMessage(null)
    try {
      // Validate email via pending session
      const res = await apiClient.post("/auth/dingtalk/email-complete", { pending_token: pendingToken, email: data.email })
      const payload = (res as { data: unknown }).data as Record<string, unknown>
      // Success → create session
      if (payload && (payload.access_token || (payload as { data?: { access_token?: string } }).data?.access_token)) {
        const inner = (payload.data ?? payload) as unknown
        await completeOAuthLogin(inner)
        try { window.sessionStorage.removeItem("pending_oauth_token") } catch {}
        const params = new URLSearchParams(window.location.search)
        const redirect = safeRedirect(params.get("redirect") ?? params.get("next"))
        setUiState("success")
        window.location.href = redirect
        return
      }
      // If backend returns success without token, still redirect
      try { window.sessionStorage.removeItem("pending_oauth_token") } catch {}
      setUiState("success")
      window.location.href = safeRedirect(new URLSearchParams(window.location.search).get("redirect"))
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to complete"
      const code = (e as { code?: string })?.code ?? (e as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === "expired" || msg.includes("expired")) {
        setUiState("expired")
        setMessage("This session has expired. Please restart DingTalk login.")
        try { window.sessionStorage.removeItem("pending_oauth_token") } catch {}
      } else {
        setUiState("error")
        setMessage(msg)
      }
    }
  }

  if (uiState === "expired") {
    return (
      <div className="mx-auto max-w-md p-8">
        <div className="rounded-lg border p-6">
          <p className="text-sm font-medium">Session expired</p>
          <p className="mt-2 text-sm text-muted-foreground" role="alert">{message}</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  if (pendingToken === null && uiState === "idle") {
    return (
      <div className="mx-auto max-w-md p-8">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <div className="rounded-lg border p-6">
        <h1 className="text-base font-semibold">Complete DingTalk sign-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email to finish linking your DingTalk account.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
            {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          {message && uiState === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <Button type="submit" className="w-full" disabled={uiState === "loading"} aria-busy={uiState === "loading"}>
            {uiState === "loading" ? "Submitting..." : "Complete sign-in"}
          </Button>
          <div className="flex justify-between text-sm">
            <Link to="/login" className="text-muted-foreground hover:underline" onClick={() => { try { window.sessionStorage.removeItem("pending_oauth_token") } catch {} }}>Cancel</Link>
            <button type="button" onClick={() => window.location.reload()} className="text-primary hover:underline">Retry</button>
          </div>
        </form>
      </div>
    </div>
  )
}
