import { createFileRoute, redirect } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/subscriptions")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("auth_user") || "null")
        if (user?.is_simple_mode) throw redirect({ to: "/admin/dashboard" })
      } catch (e) {
        if ((e as { message?: string })?.message?.includes("redirect")) throw e
      }
    }
  },
  component: AdminSubscriptionsPage,
})

function AdminSubscriptionsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const pageSize = 10

  const query = useQuery({
    queryKey: ["admin", "subscriptions", { page, search }],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/subscriptions", { params: { page, page_size: pageSize, search: search || undefined } })
      const d = data as { items?: Array<{ id: number; user: string; group: string; status: string }>; total?: number }
      return { items: d.items ?? [], total: d.total ?? 0 }
    },
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const assignMut = useMutation({
    mutationFn: async (data: { user_id: number; group_id: number; validity_days: number }) => apiClient.post("/admin/subscriptions/assign", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  })
  const extendMut = useMutation({
    mutationFn: async ({ id, days }: { id: number; days: number }) => apiClient.post(`/admin/subscriptions/${id}/extend`, { validity_days: days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  })
  const revokeMut = useMutation({
    mutationFn: async (id: number) => apiClient.post(`/admin/subscriptions/${id}/revoke`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  })
  const restoreMut = useMutation({
    mutationFn: async (id: number) => apiClient.post(`/admin/subscriptions/${id}/restore`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  })
  const resetQuotaMut = useMutation({
    mutationFn: async (id: number) => apiClient.post(`/admin/subscriptions/${id}/reset-quota`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.subscriptions.title" />
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t("common.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
            <Button variant="outline" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => assignMut.mutate({ user_id: 1, group_id: 1, validity_days: 30 })}>
              Assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => extendMut.mutate({ id: 1, days: 7 })}>
              Extend
            </Button>
            <Button variant="outline" size="sm" onClick={() => revokeMut.mutate(1)}>
              Revoke
            </Button>
            <Button variant="outline" size="sm" onClick={() => restoreMut.mutate(1)}>
              Restore
            </Button>
            <Button variant="outline" size="sm" onClick={() => resetQuotaMut.mutate(1)}>
              Reset Quota
            </Button>
          </div>
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "User", accessorKey: "user" },
              { header: "Group", accessorKey: "group" },
              { header: "Status", accessorKey: "status" },
              {
                header: "Actions",
                align: "right",
                cell: (r: { id: number }) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => extendMut.mutate({ id: r.id, days: 7 })}>
                      Extend
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => revokeMut.mutate(r.id)}>
                      Revoke
                    </Button>
                  </div>
                ),
              },
            ]}
            data={rows as unknown as Record<string, unknown>[]}
            loading={query.isLoading}
            error={query.isError ? "Failed to load subscriptions" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No subscriptions"
          />
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
