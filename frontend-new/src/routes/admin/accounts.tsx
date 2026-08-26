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
import { accountsAPI } from "@/lib/api/admin/accounts"

export const Route = createFileRoute("/admin/accounts")({ component: AccountsPage })

function AccountsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const query = useQuery({
    queryKey: ["admin", "accounts", { search }],
    queryFn: async () => {
      const { data } = await accountsAPI.list({ search: search || undefined })
      const d = data as unknown as { items?: Array<{ id: number; email: string; status: string }> }
      return d.items ?? (data as unknown as Array<{ id: number; email: string; status: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; email: string; status: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.accounts.title" />
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
              { header: "Email", accessorKey: "email" },
              { header: "Status", accessorKey: "status" },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load accounts" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No accounts"
          />
          <p className="text-xs text-muted-foreground">40+ ops: list/get/create/duplicate/update/delete/toggle/test/refreshCredentials/applyOAuth/batch ops via adminAPI.accounts</p>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
