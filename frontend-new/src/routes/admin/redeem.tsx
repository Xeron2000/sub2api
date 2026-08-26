import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/redeem")({ component: RedeemPage })

function RedeemPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")

  const query = useQuery({
    queryKey: ["admin", "redeem", { search }],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/redeem-codes", { params: { search: search || undefined } })
      const d = data as { items?: Array<{ id: number; code: string; status: string }> }
      return d.items ?? (data as Array<{ id: number; code: string; status: string }>)
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: { code: string }) => apiClient.post("/admin/redeem-codes/generate", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "redeem"] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/admin/redeem-codes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "redeem"] }),
  })

  const rows = (query.data as Array<{ id: number; code: string; status: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.redeem.title"
          action={
            <Button onClick={() => createMut.mutate({ code: `REDEEM-${Date.now()}` })} disabled={createMut.isPending}>
              Generate
            </Button>
          }
        />
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
              { header: "Code", accessorKey: "code" },
              { header: "Status", accessorKey: "status" },
              {
                header: "Actions",
                align: "right",
                cell: (r: { id: number }) => (
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(r.id)}>
                    Delete
                  </Button>
                ),
              },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load redeem codes" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No redeem codes"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
