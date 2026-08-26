import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/affiliates/invites")({ component: InvitesPage })

function InvitesPage() {
  const query = useQuery({
    queryKey: ["admin", "affiliates", "invites"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/affiliates/invites")
      const d = data as { items?: Array<{ id: number; email: string; created_at: string }> }
      return d.items ?? (data as Array<{ id: number; email: string; created_at: string }>)
    },
  })

  const rows = (query.data as Array<{ id: number; email: string; created_at: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="nav.affiliateInviteRecords" />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Email", accessorKey: "email" },
              { header: "Date", accessorKey: "created_at" },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load invites" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No invites"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
