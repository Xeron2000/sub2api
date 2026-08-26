import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query/keys"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/usage")({ component: UsagePage })

type UsageRow = { id: number; model: string; tokens: number; created_at: string }

function UsagePage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const pageSize = 10

  const query = useQuery({
    queryKey: queryKeys.usage.list({ page, search }),
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get("/usage", { params: { page, page_size: pageSize, search: search || undefined }, signal })
      return data as { items: UsageRow[]; total: number }
    },
  })

  const rows: UsageRow[] = (query.data as { items: UsageRow[] })?.items ?? []
  const total: number = (query.data as { total: number })?.total ?? rows.length

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="usage.title" descriptionKey="usage.description" action={<Button variant="outline" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
            <Button variant="ghost" onClick={() => { setSearch(""); setPage(1) }}>
              Clear filters
            </Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Model", accessorKey: "model" },
              { header: "Tokens", accessorKey: "tokens", align: "right" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.error ? (query.error as { message?: string }).message ?? "Failed to load" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No usage yet"
            emptyAction={<p className="text-sm text-muted-foreground">Usage records will appear here once you start making API calls.</p>}
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AppShell>
  )
}
