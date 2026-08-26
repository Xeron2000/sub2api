import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { queryKeys } from "@/lib/query/keys"
import { getMatrix, getSnapshot } from "@/lib/api/channelMonitorV2"
import type { MonitorFilter, MonitorRange } from "@/lib/api/channelMonitorV2"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatNumber } from "@/lib/format"

export const Route = createFileRoute("/monitor")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/monitor" } as Record<string, string> })
    }
  },
  component: MonitorPage,
})

function healthToStatus(health: string): "success" | "warning" | "error" | "default" {
  if (health === "healthy") return "success"
  if (health === "warning") return "warning"
  if (health === "critical") return "error"
  return "default"
}

function MonitorPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<MonitorRange>("90m")

  const filter: MonitorFilter = { range, platforms: [], groupIds: [], models: [] }

  const snapshotQuery = useQuery({
    queryKey: queryKeys.monitor.snapshot({ range }),
    queryFn: ({ signal }) => getSnapshot(filter, false, signal),
  })

  const matrixQuery = useQuery({
    queryKey: queryKeys.monitor.matrix({ range }),
    queryFn: ({ signal }) => getMatrix(filter, "platform", false, signal),
  })

  const snapshot = snapshotQuery.data
  const isLoading = snapshotQuery.isLoading || matrixQuery.isLoading
  const isError = snapshotQuery.isError || matrixQuery.isError
  const error = snapshotQuery.error || matrixQuery.error

  const handleRefresh = () => {
    snapshotQuery.refetch()
    matrixQuery.refetch()
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          titleKey="channelMonitorV2.title"
          descriptionKey="channelMonitorV2.description"
          action={
            <div className="flex items-center gap-2">
              <Select value={range} onValueChange={(v) => setRange((v as MonitorRange) ?? "90m")}>
                <SelectTrigger className="w-[120px]" aria-label={t("channelMonitorV2.timeRange") || "Time range"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90m">90m</SelectItem>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} aria-label={t("common.refresh")}>
                {t("common.refresh")}
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="mt-6">
            <LoadingState />
          </div>
        ) : isError ? (
          <div className="mt-6">
            <ErrorState message={getAppErrorMessage(error)} onRetry={handleRefresh} />
          </div>
        ) : !snapshot ? (
          <div className="mt-6">
            <EmptyState
              title={t("channelMonitorV2.empty.title") || "No monitoring data"}
              description={t("channelMonitorV2.empty.description") || "Monitoring data will appear once available."}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Overview KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("channelMonitorV2.metrics.successRate") || "Success Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-2xl font-semibold">{((1 - snapshot.metrics.error_rate) * 100).toFixed(1)}%</span>
                  <StatusBadge status={healthToStatus(snapshot.health.error_rate)} label={snapshot.health.error_rate} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("channelMonitorV2.metrics.ttftP50") || "TTFT P50"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-2xl font-semibold">
                    {snapshot.metrics.ttft.p50_ms != null ? `${snapshot.metrics.ttft.p50_ms}ms` : "-"}
                  </span>
                  <StatusBadge status={healthToStatus(snapshot.health.ttft)} label={snapshot.health.ttft} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("channelMonitorV2.metrics.requests") || "Requests"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{formatNumber(snapshot.metrics.request_count)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(snapshot.metrics.success_requests)} ok · {formatNumber(snapshot.metrics.error_requests)} err
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Platform matrix */}
            {matrixQuery.data?.items?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("channelMonitorV2.platforms") || "Platforms"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="px-3 py-2 text-left font-medium">Platform</th>
                          <th className="px-3 py-2 text-right font-medium">Requests</th>
                          <th className="px-3 py-2 text-right font-medium">Success</th>
                          <th className="px-3 py-2 text-right font-medium">TTFT P50</th>
                          <th className="px-3 py-2 text-left font-medium">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixQuery.data.items.map((row) => (
                          <tr key={`${row.platform}:${row.group_id ?? ""}:${row.model ?? ""}`} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">{row.platform}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(row.metrics.request_count)}</td>
                            <td className="px-3 py-2 text-right">{((1 - row.metrics.error_rate) * 100).toFixed(1)}%</td>
                            <td className="px-3 py-2 text-right">{row.metrics.ttft.p50_ms != null ? `${row.metrics.ttft.p50_ms}ms` : "-"}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={healthToStatus(row.health.overall)} label={row.health.overall} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                title={t("channelMonitorV2.noPlatforms") || "No platform data"}
                description={t("channelMonitorV2.noPlatformsDesc") || "No platform metrics for the selected time range."}
              />
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  )
}
