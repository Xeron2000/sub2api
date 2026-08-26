import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { queryKeys } from "@/lib/query/keys"
import { listUsage, getUsageStats } from "@/lib/api/usage"
import { getAppErrorMessage } from "@/lib/api/errors"
import { useDebouncedValue } from "@/lib/hooks/useDebounce"
import { formatMoney, formatNumber, formatDateTime } from "@/lib/format"

export const Route = createFileRoute("/usage")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/usage" } as Record<string, string> })
    }
  },
  component: UsagePage,
})

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function UsagePage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [model, setModel] = useState<string>("")
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return formatLocalDate(d)
  })
  const [endDate, setEndDate] = useState(() => formatLocalDate(new Date()))
  const [billingType, setBillingType] = useState<string>("all")
  const pageSize = 10

  const filters = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      model: model || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      billing_type: billingType !== "all" ? Number(billingType) : undefined,
    }),
    [page, debouncedSearch, model, startDate, endDate, billingType],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, model, startDate, endDate, billingType])

  const listQuery = useQuery({
    queryKey: queryKeys.usage.list(filters),
    queryFn: ({ signal }) => listUsage(filters, { signal }),
  })

  const statsQuery = useQuery({
    queryKey: [...queryKeys.usage.stats(), filters.start_date, filters.end_date, filters.model, filters.billing_type] as const,
    queryFn: ({ signal }) => getUsageStats({ start_date: startDate || undefined, end_date: endDate || undefined, model: model || undefined, billing_type: billingType !== "all" ? Number(billingType) : null }, { signal }),
  })

  const rows = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const stats = statsQuery.data

  const hasActiveFilter = Boolean(debouncedSearch || model || billingType !== "all" || startDate || endDate)

  const handleClear = () => {
    setSearch("")
    setModel("")
    setBillingType("all")
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
    setStartDate(formatLocalDate(d))
    setEndDate(formatLocalDate(new Date()))
    setPage(1)
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          titleKey="usage.title"
          descriptionKey="usage.description"
          action={
            <Button variant="outline" onClick={() => { listQuery.refetch(); statsQuery.refetch() }} aria-label={t("common.refresh")}>
              {t("common.refresh")}
            </Button>
          }
        />

        {/* Stats summary */}
        {stats && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("usage.totalRequests") ?? "Total Requests"}</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(stats.total_requests)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("usage.totalTokens") ?? "Total Tokens"}</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(stats.total_tokens)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("usage.totalCost") ?? "Total Cost"}</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(stats.total_actual_cost ?? stats.total_cost)}</p>
            </div>
          </div>
        )}

        {/* Toolbar: Search | Filters | Clear | Refresh */}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 max-w-sm space-y-1">
            <Label htmlFor="usage-search" className="text-xs text-muted-foreground">{t("common.search")}</Label>
            <Input
              id="usage-search"
              placeholder={t("common.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("common.search")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("usage.model") ?? "Model"}</Label>
            <Input
              placeholder={t("usage.modelPlaceholder") ?? "Filter by model"}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-[180px]"
              aria-label={t("usage.model") ?? "Model"}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.usage.billingType") ?? "Billing Type"}</Label>
            <Select value={billingType} onValueChange={(v) => setBillingType(v ?? "all")}>
              <SelectTrigger className="w-[160px]" aria-label={t("admin.usage.billingType") ?? "Billing Type"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.usage.allBillingTypes") ?? "All types"}</SelectItem>
                <SelectItem value="0">{t("admin.usage.billingTypeBalance") ?? "Balance"}</SelectItem>
                <SelectItem value="1">{t("admin.usage.billingTypeSubscription") ?? "Subscription"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="usage-start" className="text-xs text-muted-foreground">{t("common.startDate") ?? "Start"}</Label>
            <Input id="usage-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="usage-end" className="text-xs text-muted-foreground">{t("common.endDate") ?? "End"}</Label>
            <Input id="usage-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
          </div>
          <Button variant="ghost" onClick={handleClear} aria-label={t("common.clear") ?? "Clear"}>
            {t("common.clear") ?? "Clear"}
          </Button>
        </div>

        {/* Table */}
        <div className="mt-6">
          {listQuery.isLoading ? (
            <LoadingState />
          ) : listQuery.isError ? (
            <ErrorState message={getAppErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title={hasActiveFilter ? (t("usage.emptyFilteredTitle") ?? "No usage records for this filter") : (t("usage.emptyTitle") ?? "No usage yet")}
              description={hasActiveFilter ? (t("usage.emptyFilteredDesc") ?? "Try adjusting your filters or date range.") : (t("usage.emptyDesc") ?? "Usage records will appear here once you start making API calls.")}
            />
          ) : (
            <>
              <DataTable
                columns={[
                  { header: t("usage.model") ?? "Model", accessorKey: "model" },
                  { header: t("usage.tokens") ?? "Tokens", accessorKey: "total_tokens", align: "right", cell: (r) => formatNumber((r as { total_tokens?: number }).total_tokens) },
                  { header: t("usage.cost") ?? "Cost", accessorKey: "actual_cost", align: "right", cell: (r) => formatMoney((r as { actual_cost?: number }).actual_cost) },
                  { header: t("usage.time") ?? "Time", accessorKey: "created_at", cell: (r) => formatDateTime((r as { created_at?: string }).created_at) },
                ]}
                data={rows as unknown as Record<string, unknown>[]}
                loading={false}
                error={null}
                onRetry={() => listQuery.refetch()}
                getRowId={(r) => String((r as { id: number }).id)}
              />
              <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </PageContainer>
    </AppShell>
  )
}
