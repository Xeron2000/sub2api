import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/profile")({ component: ProfilePage })

function ProfilePage() {
  const [stepUpCode, setStepUpCode] = useState("")
  const [stepUpVerified, setStepUpVerified] = useState(false)

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/user/profile")
      return data as { email: string; totp_enabled: boolean; passkey_enabled: boolean }
    },
  })

  const totpMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post("/auth/totp/step-up", { code })
      return data
    },
    onSuccess: () => setStepUpVerified(true),
  })

  const handleStepUp = () => {
    if (!stepUpCode.trim()) return
    totpMutation.mutate(stepUpCode)
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="profile.title" descriptionKey="profile.description" />
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {profileQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-sm">Email: {profileQuery.data?.email ?? "-"}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">TOTP / Passkey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">TOTP: {profileQuery.data?.totp_enabled ? "Enabled" : "Disabled"}</p>
              <p className="text-sm text-muted-foreground">Passkey: {profileQuery.data?.passkey_enabled ? "Enabled" : "Disabled"}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/profile/totp-setup")}>
                  Setup TOTP
                </Button>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/profile/passkey")}>
                  Manage Passkey
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">OAuth Bindings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">LinuxDo / DingTalk / OIDC / WeChat bindings via /auth/*</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/auth/linuxdo/callback")}>
                  LinuxDo
                </Button>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/auth/dingtalk/callback")}>
                  DingTalk
                </Button>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/auth/oidc/callback")}>
                  OIDC
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step-Up Guard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter TOTP code to verify step-up for sensitive actions.</p>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="stepUp">TOTP Code</Label>
                  <Input id="stepUp" value={stepUpCode} onChange={(e) => setStepUpCode(e.target.value)} placeholder="123456" />
                </div>
                <Button onClick={handleStepUp} disabled={totpMutation.isPending} className="mt-6">
                  {totpMutation.isPending ? "Verifying..." : "Verify"}
                </Button>
              </div>
              {stepUpVerified && <p className="text-sm text-green-600">Step-up verified</p>}
              {totpMutation.isError && <p className="text-sm text-destructive">{(totpMutation.error as { message?: string })?.message ?? "Failed"}</p>}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}
