import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "@/i18n"
import { getAuthStatus } from "@/lib/auth"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { queryKeys } from "@/lib/query/keys"
import { getInternalBatchImageJobs } from "@/lib/api/batchImage"
import { getAppErrorMessage } from "@/lib/api/errors"

export const Route = createFileRoute("/batch-image")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/docs/batch-image") throw redirect({ to: "/batch-image" })
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/batch-image" } as Record<string, string> })
    }
  },
  component: BatchImageGuide,
})

function BatchImageGuide() {
  const { t } = useTranslation()
  useEffect(() => {
    if (getAuthStatus() === "anonymous" && typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/docs/batch-image") {
      if (window.location.pathname === "/batch-image") window.location.href = `/login?redirect=${encodeURIComponent("/batch-image")}`
    }
  }, [])

  const jobsQuery = useQuery({
    queryKey: queryKeys.batchImage.list({}),
    queryFn: ({ signal }) => getInternalBatchImageJobs({ signal }),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("auth_token"),
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="batchImageGuide.title" descriptionKey="batchImageGuide.description" />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">{t("batchImage.guide.uiTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("batchImage.guide.step1")}</p>
            <p>{t("batchImage.guide.step2")}</p>
            <p>{t("batchImage.guide.step3")}</p>
            <p>{t("batchImage.guide.step4")}</p>
          </CardContent>
        </Card>

        <div className="mt-6">
          {jobsQuery.isLoading ? (
            <LoadingState />
          ) : jobsQuery.isError ? (
            <ErrorState message={getAppErrorMessage(jobsQuery.error)} onRetry={() => jobsQuery.refetch()} />
          ) : !jobsQuery.data?.items?.length ? (
            <EmptyState titleKey="batchImage.list.empty" descriptionKey="batchImage.list.emptyHint" />
          ) : (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  {t("batchImage.pagination.pageItems", { count: jobsQuery.data.items.length })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
