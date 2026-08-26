import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PublicShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { queryKeys } from "@/lib/query/keys"
import { getKeyUsage } from "@/lib/api/usage"

export const Route = createFileRoute("/key-usage")({ component: KeyUsagePage })

function KeyUsagePage() {
  const [apiKey, setApiKey] = useState("")
  const [keyVisible, setKeyVisible] = useState(false)
  const [queryKey, setQueryKey] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d">("today")

  const query = useQuery({
    queryKey: queryKeys.usage.list({ key: queryKey, range: dateRange }),
    queryFn: async () => {
      if (!queryKey) throw new Error("No key")
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (dateRange === "today") return getKeyUsage(queryKey, { timezone })
      const days = dateRange === "7d" ? 7 : 30
      const end = new Date().toISOString().slice(0, 10)
      const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      return getKeyUsage(queryKey, { start_date: start, end_date: end, timezone })
    },
    enabled: !!queryKey,
    retry: false,
  })

  const handleQuery = () => {
    const trimmed = apiKey.trim()
    if (!trimmed) return
    setQueryKey(trimmed)
  }

  return (
    <PublicShell>
      <PageContainer>
        <PageHeader titleKey="usage.title" descriptionKey="usage.description" />

        <div className="mt-6 max-w-xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <Label htmlFor="apiKey" className="sr-only">
              API Key
            </Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type={keyVisible ? "text" : "password"}
              placeholder="sk-..."
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
            <button
              type="button"
              onClick={() => setKeyVisible(!keyVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {keyVisible ? "Hide" : "Show"}
            </button>
          </div>
          <Button onClick={handleQuery} disabled={!apiKey.trim() || query.isFetching}>
            {query.isFetching ? "Querying..." : "Query"}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Key is sent as Bearer header, not stored. Date range affects usage query.
        </p>

        <div className="mt-4 flex justify-center gap-2">
          {(["today", "7d", "30d"] as const).map((r) => (
            <Button
              key={r}
              variant={dateRange === r ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(r)}
            >
              {r === "today" ? "Today" : r === "7d" ? "7 days" : "30 days"}
            </Button>
          ))}
        </div>

        {queryKey && (
          <div className="mt-8 space-y-6">
            {query.isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-44 w-full rounded-2xl" />
              </div>
            ) : query.isError ? (
              <Card className="border-destructive/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{(query.error as { message?: string })?.message ?? "Query failed"}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : query.data ? (
              <>
                {query.data.quota && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Quota</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-center">
                          <div className="relative w-44 h-44">
                            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="8"
                                strokeDasharray={`${Math.min(100, (query.data.quota.used / Math.max(1, query.data.quota.limit)) * 251)} 251`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold">{Math.round((query.data.quota.used / Math.max(1, query.data.quota.limit)) * 100)}%</span>
                              <span className="text-xs text-muted-foreground">used</span>
                              <span className="text-sm font-medium text-primary">
                                ${query.data.quota.used.toFixed(2)} / ${query.data.quota.limit.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-center text-xs text-muted-foreground">Remaining: ${query.data.quota.remaining.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Usage Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Requests</span>
                            <span className="font-medium">{query.data.usage?.today?.requests ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tokens</span>
                            <span className="font-medium">{query.data.usage?.today?.total_tokens ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Requests</span>
                            <span className="font-medium">{query.data.usage?.total?.requests ?? "-"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!query.data.quota && query.data.usage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Token Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Today Requests</p>
                          <p className="font-medium">{query.data.usage.today?.requests ?? "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Tokens</p>
                          <p className="font-medium">{query.data.usage.today?.total_tokens ?? "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {query.data.model_stats && query.data.model_stats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Model Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="text-left py-2">Model</th>
                              <th className="text-right">Requests</th>
                              <th className="text-right">Tokens</th>
                            </tr>
                          </thead>
                          <tbody>
                            {query.data.model_stats.map((m, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-2">{m.model}</td>
                                <td className="text-right">{m.requests}</td>
                                <td className="text-right">{m.total_tokens}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}
      </PageContainer>
    </PublicShell>
  )
}
