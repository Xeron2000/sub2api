import { useSearchParams } from "react-router-dom"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function EmailVerifyPage() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""
  const [status, setStatus] = useState("")
  const verify = async () => {
    await httpClient.post("/auth/verify-email", { token })
    setStatus("Verified — you can login now.")
  }
  return (
    <Page>
      <PageHeader title="Verify Email" description="Confirm your email address." />
      <Section>
        <div className="max-w-md space-y-4">
          <p className="text-sm">Token: {token || "(missing — check your email link)"}</p>
          <Button onClick={verify} disabled={!token}>Verify</Button>
          {status && <p className="text-sm text-emerald-600">{status}</p>}
        </div>
      </Section>
    </Page>
  )
}
