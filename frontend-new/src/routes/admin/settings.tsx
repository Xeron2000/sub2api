import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { queryKeys } from "@/lib/query/keys"
import { getSettings, updateSettings } from "@/lib/api/admin/settings"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { ErrorState } from "@/components/shared/ErrorState"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: createAdminGuard(),
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [siteName, setSiteName] = useState("")
  const [emailTemplate, setEmailTemplate] = useState("")

  const query = useQuery({
    queryKey: queryKeys.admin.settings.detail(),
    queryFn: ({ signal }) => getSettings({ signal }),
  })

  useEffect(() => {
    const d = query.data as { site_name?: string; email_template?: string } | undefined
    if (d?.site_name) setSiteName(d.site_name)
    if (d?.email_template) setEmailTemplate(d.email_template)
  }, [query.data])

  const mutation = useMutation({
    mutationFn: (data: { site_name: string; email_template: string }) => updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.settings.all() })
      toast.success(t("common.saved"))
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  if (query.isError) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.settings.title" />
          <div className="mt-6"><ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
        </PageContainer>
      </AdminShell>
    )
  }

  if (query.isLoading) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.settings.title" />
          <div className="mt-6"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
        </PageContainer>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.settings.title" />
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.settings.general") ?? "General"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">{t("admin.settings.siteName") ?? "Site Name"}</Label>
                <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Sub2API" />
              </div>
              <Button onClick={() => mutation.mutate({ site_name: siteName, email_template: emailTemplate })} disabled={mutation.isPending} aria-busy={mutation.isPending}>
                {mutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.settings.emailTemplates") ?? "Email Templates"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailTemplate">{t("admin.settings.verificationEmail") ?? "Verification Email"}</Label>
                <Textarea id="emailTemplate" value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={6} placeholder={"Hello {{name}}..."} />
              </div>
              <Button variant="outline" onClick={() => mutation.mutate({ site_name: siteName, email_template: emailTemplate })} disabled={mutation.isPending}>
                {t("common.save")}
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            {t("admin.settings.parityNote") ?? "Full settings (9 tabs, 100+ fields) are tracked in docs/admin-settings-parity.md. Sensitive fields are masked; unchanged masks are not sent back."}
          </p>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
