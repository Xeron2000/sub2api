import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { getOpsOverview } from "@/lib/api/admin/ops"
import { createAdminGuard } from "@/lib/guard/adminGuard"
import { getAppErrorMessage } from "@/lib/api/errors"
import { ErrorState } from "@/components/shared/ErrorState"

export const Route = createFileRoute("/admin/ops")({
  beforeLoad: createAdminGuard(),
  component: OpsPage,
})

function OpsPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: queryKeys.admin.ops.overview(),
    queryFn: ({ signal }) => getOpsOverview({ signal }),
  })

  if (query.isError) {
    const msg = getAppErrorMessage(query.error)
    if (String(msg).toLowerCase().includes("disabled") || msg === "OPS_DISABLED") {
      return (
        <AdminShell>
          <PageContainer>
            <PageHeader titleKey="admin.ops.title" />
            <div className="mt-6"><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{t("admin.ops.disabled") ?? "Ops monitoring is disabled. Enable ops_monitoring_enabled in Settings."}</p></CardContent></Card></div>
          </PageContainer>
        </AdminShell>
      )
    }
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.ops.title" />
          <div className="mt-6"><ErrorState message={msg} onRetry={() => query.refetch()} /></div>
        </PageContainer>
      </AdminShell>
    )
  }

  if (query.isLoading) {
    return (
      <AdminShell>
        <PageContainer>
          <PageHeader titleKey="admin.ops.title" />
          <div className="mt-6"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
        </PageContainer>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.ops.title" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("admin.ops.overview") ?? "Overview"}</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{t("admin.ops.uptime") ?? "Uptime"}: {String((query.data as { uptime?: string })?.uptime ?? "-")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("admin.ops.requests") ?? "Requests"}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{String((query.data as { requests?: number })?.requests ?? "-")}</p></CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
