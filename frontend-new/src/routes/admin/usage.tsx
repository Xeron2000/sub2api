import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/usage")({ component: AdminUsagePage })

function AdminUsagePage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const query = useQuery({
    queryKey: ["admin", "usage", { search }],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/usage", { params: { search: search || undefined } })
      const d = data as { items?: Array<{ id: number; user: string; model: string; tokens: number }> }
      return d.items ?? (data as Array<{ id: number; user: string; model: string; tokens: number }>)
    },
  })

  const rows = (query.data as Array<{ id: number; user: string; model: string; tokens: number }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.usage.title" />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Button variant="outline" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "User", accessorKey: "user" },
              { header: "Model", accessorKey: "model" },
              { header: "Tokens", accessorKey: "tokens", align: "right" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load usage" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No usage logs"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
