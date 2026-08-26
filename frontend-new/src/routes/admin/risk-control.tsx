import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { getRiskConfig } from "@/lib/api/admin/risk"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { ErrorState } from "@/components/shared/ErrorState"

export const Route = createFileRoute("/admin/risk-control")({
  beforeLoad: createAdminGuard({ requireRiskControl: true }),
  component: RiskControlPage,
})

function RiskControlPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.admin.risk.config(),
    queryFn: ({ signal }) => getRiskConfig({ signal }),
  })

  if (query.isError) {
    const msg = getAppErrorMessage(query.error)
    // risk_control disabled: backend 404 falls back to disabled notice, not 500 crash
    if (String(msg).toLowerCase().includes("disabled") || (query.error as { status?: number })?.status === 404) {
      return (
        <AdminShell>
          <PageContainer>
            <PageHeader titleKey="admin.riskControl.title" />
            <div className="mt-6"><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{t("admin.riskControl.disabled") ?? "Risk control is disabled (risk_control_enabled=false)."}</p></CardContent></Card></div>
          </PageContainer>
        </AdminShell>
      )
    }
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.riskControl.title" />
          <div className="mt-6"><ErrorState message={msg} onRetry={() => query.refetch()} /></div>
        </PageContainer>
      </AdminShell>
    )
  }

  if (query.isLoading) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.riskControl.title" />
          <div className="mt-6"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
        </PageContainer>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.riskControl.title" />
        <div className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.riskControl.config") ?? "Config"}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">{t("common.enabled")}: {String((query.data as { enabled?: boolean })?.enabled ?? "-")}</p>
              <p className="text-sm text-muted-foreground">{t("admin.riskControl.mode") ?? "Mode"}: {String((query.data as { mode?: string })?.mode ?? "-")}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
