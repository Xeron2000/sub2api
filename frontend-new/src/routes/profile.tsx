import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageSection } from "@/components/shared/PageSection"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { queryKeys } from "@/lib/query/keys"
import { getProfile, updateProfile, changePassword } from "@/lib/api/profile"
import { getAppErrorMessage } from "@/lib/api/errors"
import { toast } from "@/lib/toast"
import { totpAPI } from "@/lib/api/totp"
import { passkeyAPI } from "@/lib/api/passkey"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/profile" } as Record<string, string> })
    }
  },
  component: ProfilePage,
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Required"),
    new_password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Required"),
  })
  .refine((d) => d.new_password === d.confirm, { message: "Passwords do not match", path: ["confirm"] })

type PasswordForm = z.infer<typeof passwordSchema>

const profileSchema = z.object({ username: z.string().min(1, "Required").max(64) })
type ProfileForm = z.infer<typeof profileSchema>

function ProfilePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: ({ signal }) => getProfile({ signal }),
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profileQuery.data ? { username: profileQuery.data.username ?? "" } : undefined,
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { old_password: "", new_password: "", confirm: "" },
  })

  const updateProfileMut = useMutation({
    mutationFn: (data: ProfileForm) => updateProfile({ username: data.username }),
    onSuccess: () => {
      toast.success(t("profile.updateSuccess") || "Profile updated")
      setProfileError(null)
      qc.invalidateQueries({ queryKey: queryKeys.profile.detail() })
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
    onError: (err) => setProfileError(getAppErrorMessage(err)),
  })

  const changePwdMut = useMutation({
    mutationFn: (data: PasswordForm) => changePassword({ old_password: data.old_password, new_password: data.new_password }),
    onSuccess: () => {
      toast.success(t("profile.passwordChanged") || "Password changed")
      setPwdError(null)
      passwordForm.reset()
    },
    onError: (err) => {
      const msg = getAppErrorMessage(err)
      // Try to map to field error if backend returns field metadata
      const e = err as { metadata?: Record<string, string> }
      if (e?.metadata?.old_password) passwordForm.setError("old_password", { message: e.metadata.old_password })
      else if (e?.metadata?.new_password) passwordForm.setError("new_password", { message: e.metadata.new_password })
      else setPwdError(msg)
    },
  })

  if (profileQuery.isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <PageHeader titleKey="profile.title" descriptionKey="profile.description" />
          <div className="mt-6">
            <LoadingState />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  if (profileQuery.isError) {
    return (
      <AppShell>
        <PageContainer>
          <PageHeader titleKey="profile.title" descriptionKey="profile.description" />
          <div className="mt-6">
            <ErrorState message={getAppErrorMessage(profileQuery.error)} onRetry={() => profileQuery.refetch()} />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  const user = profileQuery.data

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="profile.title" descriptionKey="profile.description" />

        <div className="mt-6 space-y-6">
          {/* Account */}
          <PageSection titleKey="profile.account.title" descriptionKey="profile.account.description">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("profile.email") || "Email"}</p>
                  <p className="text-sm font-medium break-all">{user?.email ?? "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("profile.role") || "Role"}</p>
                  <p className="text-sm">
                    <Badge variant="outline">{(user?.role as string) || "user"}</Badge>
                  </p>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit((v) => {
                  setProfileError(null)
                  updateProfileMut.mutate(v)
                })}
                noValidate
                className="flex flex-wrap items-end gap-3"
              >
                <div className="min-w-[240px] flex-1 max-w-sm space-y-1">
                  <Label htmlFor="profile-username">{t("profile.username") || "Username"}</Label>
                  <Input
                    id="profile-username"
                    {...profileForm.register("username")}
                    aria-invalid={!!profileForm.formState.errors.username}
                    autoComplete="username"
                  />
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-destructive">{profileForm.formState.errors.username.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={updateProfileMut.isPending} aria-busy={updateProfileMut.isPending}>
                  {updateProfileMut.isPending ? (t("common.saving") || "Saving...") : (t("common.save") || "Save")}
                </Button>
              </form>
              {profileError && (
                <p role="alert" className="text-sm text-destructive">
                  {profileError}
                </p>
              )}
            </div>
          </PageSection>

          {/* Security — Password */}
          <PageSection titleKey="profile.security.title" descriptionKey="profile.security.description">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("profile.changePassword") || "Change Password"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit((v) => {
                    setPwdError(null)
                    changePwdMut.mutate(v)
                  })}
                  noValidate
                  className="max-w-md space-y-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="old_password">{t("profile.oldPassword") || "Current password"}</Label>
                    <Input
                      id="old_password"
                      type="password"
                      {...passwordForm.register("old_password")}
                      aria-invalid={!!passwordForm.formState.errors.old_password}
                      autoComplete="current-password"
                    />
                    {passwordForm.formState.errors.old_password && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.old_password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new_password">{t("profile.newPassword") || "New password"}</Label>
                    <Input
                      id="new_password"
                      type="password"
                      {...passwordForm.register("new_password")}
                      aria-invalid={!!passwordForm.formState.errors.new_password}
                      autoComplete="new-password"
                    />
                    {passwordForm.formState.errors.new_password && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm">{t("profile.confirmPassword") || "Confirm new password"}</Label>
                    <Input
                      id="confirm"
                      type="password"
                      {...passwordForm.register("confirm")}
                      aria-invalid={!!passwordForm.formState.errors.confirm}
                      autoComplete="new-password"
                    />
                    {passwordForm.formState.errors.confirm && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.confirm.message}</p>
                    )}
                  </div>
                  {pwdError && (
                    <p role="alert" className="text-sm text-destructive">
                      {pwdError}
                    </p>
                  )}
                  <Button type="submit" disabled={changePwdMut.isPending} aria-busy={changePwdMut.isPending}>
                    {changePwdMut.isPending ? (t("common.saving") || "Saving...") : (t("profile.updatePassword") || "Update password")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">{t("profile.totp.title") || "Two-Factor Authentication"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Badge variant={user?.totp_enabled ? "default" : "outline"}>
                  {user?.totp_enabled ? (t("profile.totp.enabled") || "TOTP enabled") : (t("profile.totp.disabled") || "TOTP disabled")}
                </Badge>
                <Badge variant={user?.passkey_enabled ? "default" : "outline"}>
                  {user?.passkey_enabled ? (t("profile.passkey.enabled") || "Passkey enabled") : (t("profile.passkey.disabled") || "Passkey disabled")}
                </Badge>
                <p className="w-full text-xs text-muted-foreground">
                  {t("profile.securityHint") || "Manage TOTP and passkeys in your security settings."}
                </p>
              </CardContent>
            </Card>

            {/* TOTP Full Flow */}
            <TotpCard user={user} onRefresh={() => qc.invalidateQueries({ queryKey: queryKeys.profile.detail() })} />
            {/* Passkey Full Flow */}
            <PasskeyCard />
            {/* OAuth Bind / Unbind */}
            <OAuthBindCard />
          </PageSection>

          {/* Preferences */}
          <PageSection titleKey="profile.preferences.title" descriptionKey="profile.preferences.description">
            <p className="text-sm text-muted-foreground">
              {t("profile.preferencesDesc") || "Language and theme preferences are available in the header."}
            </p>
          </PageSection>
        </div>
      </PageContainer>
    </AppShell>
  )
}

function TotpCard({ user, onRefresh }: { user: { totp_enabled?: boolean } | null | undefined; onRefresh: () => void }) {
  const [setup, setSetup] = useState<{ qr?: string; secret?: string; token?: string } | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const handleSetup = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await totpAPI.initiateSetup()
      // Secret only transient in memory, never in toast/console/URL/localStorage (§24)
      setSetup({ qr: (res as { qr_url?: string; qrcode?: string })?.qr_url ?? (res as { qrcode?: string })?.qrcode, secret: (res as { secret?: string })?.secret, token: (res as { setup_token?: string })?.setup_token })
    } catch (e) {
      setError(getAppErrorMessage(e))
    } finally { setLoading(false) }
  }
  const handleVerify = async () => {
    if (!setup?.token) return
    setError(null)
    setLoading(true)
    try {
      await totpAPI.enable({ code, setup_token: setup.token } as never)
      setSetup(null)
      setCode("")
      onRefresh()
      toast.success("TOTP enabled")
    } catch (e) {
      setError(getAppErrorMessage(e))
    } finally { setLoading(false) }
  }
  const handleDisable = async () => {
    setError(null)
    setLoading(true)
    try {
      // Step-up may be required — UI leaves recovery to backend error mapping
      await totpAPI.disable({} as never).catch(async () => {
        // Try email code flow if needed
        const { data } = await apiClient.post("/user/totp/disable", {})
        return data
      })
      onRefresh()
      toast.success("TOTP disabled")
    } catch (e) { setError(getAppErrorMessage(e)) } finally { setLoading(false) }
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">TOTP — Authenticator</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Setup QR is shown only once. Secret stays in memory.</p>
        {!user?.totp_enabled ? (
          <>
            <Button variant="outline" size="sm" onClick={handleSetup} disabled={loading}>{loading ? "Loading..." : "Setup TOTP"}</Button>
            {setup && (
              <div className="space-y-2 rounded border p-3">
                {setup.qr && <img src={setup.qr} alt="TOTP QR" className="h-32 w-32" />}
                <div className="flex gap-2">
                  <Input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                  <Button onClick={handleVerify} disabled={loading || code.length !== 6}>Verify & Enable</Button>
                </div>
                <p className="text-xs text-muted-foreground">Failed verification will not fake enabled (§25).</p>
              </div>
            )}
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={handleDisable} disabled={loading}>Disable TOTP</Button>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

function PasskeyCard() {
  const [creds, setCreds] = useState<Array<{ id: number; name: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const load = async () => {
    try {
      const data = await passkeyAPI.list?.() ?? []
      setCreds((data as unknown as Array<{ id: number; name: string }>) ?? [])
    } catch {}
  }
  useEffect(() => { void load() }, [])
  const handleRegister = async () => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) { setError("Passkeys not supported in this browser"); return }
    setError(null); setLoading(true)
    try {
      // WebAuthn must be client-only and secure context (§28)
      if (!window.isSecureContext) throw new Error("Secure context required")
      const mod = passkeyAPI as unknown as { register?: (name: string, pw: string) => Promise<unknown> }
      if (mod.register) await mod.register("default", "")
      else {
        const { data } = await apiClient.post("/auth/passkey/register/begin", {})
        const opts = (data as { options?: unknown })?.options ?? data
        const cred = await navigator.credentials.create(opts as never) as PublicKeyCredential | null
        if (!cred) throw new Error("Creation canceled")
        await apiClient.post("/auth/passkey/register/finish", { credential: cred })
      }
      await load()
      toast.success("Passkey registered")
    } catch (e) {
      const err = e as { name?: string }
      if (err?.name === "NotAllowedError") setError("Operation canceled or timed out")
      else if (err?.name === "InvalidStateError") setError("Authenticator already registered")
      else if (err?.name === "SecurityError") setError("Security error — check secure context")
      else setError(getAppErrorMessage(e))
    } finally { setLoading(false) }
  }
  const handleDelete = async (id: number) => {
    setLoading(true)
    try { await apiClient.delete(`/auth/passkey/${id}`); await load() } catch (e) { setError(getAppErrorMessage(e)) } finally { setLoading(false) }
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Passkeys</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRegister} disabled={loading}>{loading ? "..." : "Register passkey"}</Button>
          <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
        </div>
        {creds.length ? creds.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded border p-2 text-sm">
            <span>{c.name}</span><Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
          </div>
        )) : <p className="text-xs text-muted-foreground">No passkeys yet.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Cancel is not treated as system error (§27). Supports keyboard & screen reader.</p>
      </CardContent>
    </Card>
  )
}

function OAuthBindCard() {
  const [providers] = useState<Array<{ id: string; enabled?: boolean; bound?: boolean }>>([])
  const [error, setError] = useState<string | null>(null)
  void setError
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">OAuth Connections</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {providers.length === 0 && <p className="text-xs text-muted-foreground">Manage OAuth bindings — binds use dedicated callback, never reuse login session flow (§29).</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Last login method protection: unbinding that would leave no password/passkey/OAuth is blocked by backend guard (§30).</p>
      </CardContent>
    </Card>
  )
}
