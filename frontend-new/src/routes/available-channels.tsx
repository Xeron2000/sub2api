import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"

export const Route = createFileRoute("/available-channels")({ component: AvailableChannelsPage })

function AvailableChannelsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const query = useQuery({
    queryKey: queryKeys.channels.available(),
    queryFn: async () => {
      const { data } = await apiClient.get("/channels/available")
      return data as Array<{ id: number; name: string; description?: string }>
    },
  })

  const filtered = (query.data ?? []).filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description ?? "").toLowerCase().includes(search.toLowerCase()))

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="nav.availableChannels" descriptionKey="nav.availableChannelsDesc" />
        <div className="mt-6 flex gap-3">
          <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Button variant="outline" onClick={() => query.refetch()}>
            Refresh
          </Button>
        </div>
        <div className="mt-6">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">Failed to load</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">No channels found.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((ch) => (
                <Card key={ch.id}>
                  <CardContent className="pt-6">
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-sm text-muted-foreground">{ch.description ?? "-"}</p>
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
