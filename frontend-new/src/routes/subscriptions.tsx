import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query/keys"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatMoney, formatDateTime } from "@/lib/format"
import { getMySubscriptions } from "@/lib/api/subscriptions"

function subscriptionStatusVariant(status: string): "success" | "warning" | "error" | "default" {
  if (status === "active") return "success"
  if (status === "expired") return "default"
  if (status === "cancelled" || status === "canceled") return "error"
  return "warning"
}

export const Route = createFileRoute("/subscriptions")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/subscriptions" } as Record<string, string> })
    }
  },
  component: SubscriptionsPage,
})

function SubscriptionsPage() {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: queryKeys.subscriptions.list(),
    queryFn: ({ signal }) => getMySubscriptions({ signal }),
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          titleKey="userSubscriptions.title"
          descriptionKey="userSubscriptions.description"
          action={
            <Button variant="outline" asChild>
              <Link to="/purchase">{t("userSubscriptions.buyMore") || t("common.purchase") || "Purchase"}</Link>
            </Button>
          }
        />

        <div className="mt-6">
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : !query.data?.length ? (
            <EmptyState
              title={t("userSubscriptions.noActiveSubscriptions") || "No subscriptions yet"}
              description={t("userSubscriptions.noActiveSubscriptionsDesc") || "Your subscriptions will appear here once you purchase a plan."}
              action={
                <Button asChild>
                  <Link to="/purchase">{t("userSubscriptions.browsePlans") || "Browse Plans"}</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {query.data.map((sub) => {
                const group = sub.group
                const hasLimits = Boolean(group?.daily_limit_usd || group?.weekly_limit_usd || group?.monthly_limit_usd)
                return (
                  <Card key={sub.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                      <div>
                        <CardTitle className="text-base">{group?.name ?? `Group #${sub.group_id}`}</CardTitle>
                        {group?.description && <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>}
                        {group?.platform && <p className="mt-1 text-xs text-muted-foreground">{group.platform}</p>}
                      </div>
                      <StatusBadge status={subscriptionStatusVariant(sub.status)} label={t(`userSubscriptions.status.${sub.status}`) || sub.status} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sub.expires_at ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("userSubscriptions.expires") || "Expires"}</span>
                          <span className="font-medium">{formatDateTime(sub.expires_at)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("userSubscriptions.expires") || "Expires"}</span>
                          <span className="text-muted-foreground">{t("userSubscriptions.noExpiration") || "No expiration"}</span>
                        </div>
                      )}

                      {group?.daily_limit_usd ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("userSubscriptions.daily") || "Daily"}</span>
                            <span className="font-medium">{formatMoney(sub.daily_usage_usd)} / {formatMoney(group.daily_limit_usd)}</span>
                          </div>
                          <Progress value={Math.min(100, ((sub.daily_usage_usd ?? 0) / group.daily_limit_usd) * 100)} />
                        </div>
                      ) : null}
                      {group?.weekly_limit_usd ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("userSubscriptions.weekly") || "Weekly"}</span>
                            <span className="font-medium">{formatMoney(sub.weekly_usage_usd)} / {formatMoney(group.weekly_limit_usd)}</span>
                          </div>
                          <Progress value={Math.min(100, ((sub.weekly_usage_usd ?? 0) / group.weekly_limit_usd) * 100)} />
                        </div>
                      ) : null}
                      {group?.monthly_limit_usd ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("userSubscriptions.monthly") || "Monthly"}</span>
                            <span className="font-medium">{formatMoney(sub.monthly_usage_usd)} / {formatMoney(group.monthly_limit_usd)}</span>
                          </div>
                          <Progress value={Math.min(100, ((sub.monthly_usage_usd ?? 0) / group.monthly_limit_usd) * 100)} />
                        </div>
                      ) : null}

                      {!hasLimits && (
                        <div className="flex items-center justify-center rounded-lg bg-muted py-4">
                          <p className="text-sm font-medium text-muted-foreground">{t("userSubscriptions.unlimited") || "Unlimited"}</p>
                        </div>
                      )}

                      {sub.status === "active" && (
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link to="/purchase" search={{ group: String(sub.group_id) } as never}>
                            {t("payment.renewNow") || "Renew"}
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
