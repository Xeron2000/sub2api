import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { queryKeys } from "@/lib/query/keys"
import { getAppErrorMessage } from "@/lib/api/errors"
import { getAvailableChannels } from "@/lib/api/channels"
import type { UserAvailableChannel } from "@/lib/api/channels"

export const Route = createFileRoute("/available-channels")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/available-channels" } as Record<string, string> })
    }
  },
  component: AvailableChannelsPage,
})

function AvailableChannelsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  const query = useQuery({
    queryKey: queryKeys.channels.available(),
    queryFn: ({ signal }) => getAvailableChannels({ signal }),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return query.data ?? []
    return (query.data ?? [])
      .map((ch) => {
        if (ch.name.toLowerCase().includes(q) || (ch.description || "").toLowerCase().includes(q)) return ch
        const matchingSections = ch.platforms.filter(
          (p) =>
            p.platform.toLowerCase().includes(q) ||
            p.groups.some((g) => g.name.toLowerCase().includes(q)) ||
            p.supported_models.some((m) => m.name.toLowerCase().includes(q)),
        )
        if (matchingSections.length === 0) return null
        return { ...ch, platforms: matchingSections }
      })
      .filter((ch): ch is UserAvailableChannel => ch !== null)
  }, [query.data, search])

  const hasFilter = search.trim().length > 0

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="availableChannels.title" descriptionKey="availableChannels.description" />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Input
            placeholder={t("availableChannels.searchPlaceholder") || t("common.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            aria-label={t("common.search") || "Search"}
          />
          <Button variant="outline" onClick={() => query.refetch()} aria-label={t("common.refresh")}>
            {t("common.refresh")}
          </Button>
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState message={getAppErrorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={hasFilter ? (t("availableChannels.emptyFiltered") || "No matching channels") : (t("availableChannels.empty") || "No available channels")}
              description={
                hasFilter
                  ? (t("availableChannels.emptyFilteredDesc") || "Try a different search term.")
                  : (t("availableChannels.emptyDesc") || "No channels are currently available for your account.")
              }
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((ch) => (
                <Card key={ch.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{ch.name}</CardTitle>
                    {ch.description && <p className="text-sm text-muted-foreground">{ch.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ch.platforms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("availableChannels.noModels") || "No models"}</p>
                    ) : (
                      ch.platforms.map((section) => (
                        <div key={section.platform} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{section.platform}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {section.groups.length} {t("availableChannels.groups") || "groups"} · {section.supported_models.length}{" "}
                              {t("availableChannels.models") || "models"}
                            </span>
                          </div>
                          {section.groups.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {section.groups.map((g) => (
                                <Badge key={g.id} variant="outline" className="text-xs">
                                  {g.name}
                                  {g.rate_multiplier !== 1 ? ` ×${g.rate_multiplier}` : ""}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {section.supported_models.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {section.supported_models.map((m) => (
                                <Badge key={m.name} variant="outline" className="text-xs font-mono">
                                  {m.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
