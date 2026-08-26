import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
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
