import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function DingTalkCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const code = params.get("code")
    const state = params.get("state")
    if (!code) { setError("Missing code"); return }
    const path = window.location.pathname
    httpClient.get(path.replace("/auth", "/auth/oauth").replace("/callback", "/callback"), { params: { code, state } } as unknown as Record<string, unknown>)
      .then((r) => {
        const d = r.data as { token?: string; refresh_token?: string; user?: unknown }
        if (d?.token) localStorage.setItem("auth_token", d.token)
        if (d?.refresh_token) localStorage.setItem("refresh_token", d.refresh_token)
        if (d?.user) localStorage.setItem("auth_user", JSON.stringify(d.user))
        navigate("/dashboard")
      })
      .catch((e) => setError((e as Error).message))
  }, [params, navigate])
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  return <Page><PageHeader title="DingTalkCallback" description="OAuth callback — completing authentication." /><Section><LoadingState /></Section></Page>
}
