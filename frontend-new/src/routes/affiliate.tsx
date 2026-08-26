import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageSection } from "@/components/shared/PageSection"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { CopyButton } from "@/components/shared/CopyButton"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { getAffiliateDetail, getAffiliateInvitees, transferAffiliate } from "@/lib/api/affiliate"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatMoney, formatDateTime } from "@/lib/format"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/affiliate")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/affiliate" } as Record<string, string> })
    }
  },
  component: AffiliatePage,
})

function AffiliatePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: queryKeys.affiliate.detail(),
    queryFn: ({ signal }) => getAffiliateDetail({ signal }),
  })

  const inviteesQuery = useQuery({
    queryKey: queryKeys.affiliate.invitees(),
    queryFn: ({ signal }) => getAffiliateInvitees({ signal }),
  })

  const transfer = useMutation({
    mutationFn: () => transferAffiliate(),
    onSuccess: (data) => {
      toast.success(data.message || t("affiliate.transfer.success") || "Transferred successfully")
      qc.invalidateQueries({ queryKey: queryKeys.affiliate.detail() })
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
    onError: (err) => toast.error(getAppErrorMessage(err)),
  })

  useEffect(() => {
    if (getAuthStatus() === "anonymous" && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = `/login?redirect=${encodeURIComponent("/affiliate")}`
    }
  }, [])

  const detail = detailQuery.data
  const inviteLink =
    typeof window !== "undefined" && detail?.aff_code
      ? `${window.location.origin}/register?aff=${encodeURIComponent(detail.aff_code)}`
      : detail?.aff_code
        ? `/register?aff=${encodeURIComponent(detail.aff_code)}`
        : ""

  const isLoading = detailQuery.isLoading
  const isError = detailQuery.isError

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="affiliate.title" descriptionKey="affiliate.description" />

        {isLoading ? (
          <div className="mt-6">
            <LoadingState />
          </div>
        ) : isError ? (
          <div className="mt-6">
            <ErrorState message={getAppErrorMessage(detailQuery.error)} onRetry={() => detailQuery.refetch()} />
          </div>
        ) : detail ? (
          <div className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("affiliate.stats.rebateRate") || "Rebate Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {(() => {
                      const v = detail.effective_rebate_rate_percent ?? 0
                      const rounded = Math.round(v * 100) / 100
                      return Number.isInteger(rounded) ? String(rounded) : String(rounded)
                    })()}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("affiliate.stats.invitedUsers") || "Invited Users"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{detail.aff_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("affiliate.stats.availableQuota") || "Available Quota"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{formatMoney(detail.aff_quota)}</p>
                  {detail.aff_history_quota > 0 && (
                    <p className="text-xs text-muted-foreground">Total: {formatMoney(detail.aff_history_quota)}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invite code + link — MUST use CopyButton per §21 */}
            <PageSection titleKey="affiliate.inviteCodeTitle">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border bg-muted px-3 py-2 text-sm font-medium">{detail.aff_code || "-"}</code>
                  {detail.aff_code && <CopyButton value={detail.aff_code} label={t("affiliate.copyCode") || "Copy"} />}
                </div>
                {inviteLink && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded border bg-muted px-3 py-2 text-sm">{inviteLink}</code>
                    <CopyButton value={inviteLink} label={t("affiliate.copyLink") || "Copy Link"} />
                  </div>
                )}
              </div>
            </PageSection>

            {/* Transfer */}
            <PageSection titleKey="affiliate.transfer.title" descriptionKey="affiliate.transfer.description">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => transfer.mutate()}
                  disabled={transfer.isPending || (detail.aff_quota ?? 0) <= 0}
                  aria-busy={transfer.isPending}
                >
                  {transfer.isPending
                    ? (t("affiliate.transfer.transferring") || "Transferring...")
                    : (t("affiliate.transfer.button") || "Transfer to Balance")}
                </Button>
                {(detail.aff_quota ?? 0) <= 0 && (
                  <p className="text-sm text-muted-foreground">{t("affiliate.transfer.empty") || "No quota available to transfer."}</p>
                )}
              </div>
            </PageSection>

            {/* Invitees */}
            <PageSection titleKey="affiliate.invitees.title">
              {inviteesQuery.isLoading ? (
                <LoadingState />
              ) : inviteesQuery.isError ? (
                <ErrorState message={getAppErrorMessage(inviteesQuery.error)} onRetry={() => inviteesQuery.refetch()} />
              ) : !inviteesQuery.data?.length ? (
                <EmptyState
                  title={t("affiliate.invitees.empty") || "No referrals yet"}
                  description={t("affiliate.invitees.emptyDesc") || "Invited users will appear here."}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">{t("affiliate.invitees.columns.email") || "Email"}</th>
                        <th className="px-3 py-2 text-left font-medium">{t("affiliate.invitees.columns.username") || "Username"}</th>
                        <th className="px-3 py-2 text-left font-medium">{t("affiliate.invitees.columns.joinedAt") || "Joined"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inviteesQuery.data.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="px-3 py-2">{inv.email || "-"}</td>
                          <td className="px-3 py-2">{inv.username || "-"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDateTime(inv.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PageSection>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title={t("affiliate.emptyTitle") || "No affiliate data"} />
          </div>
        )}
      </PageContainer>
    </AppShell>
  )
}
