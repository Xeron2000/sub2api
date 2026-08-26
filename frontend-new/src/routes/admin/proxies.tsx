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
import { proxiesAPI } from "@/lib/api/admin/proxies"

export const Route = createFileRoute("/admin/proxies")({ component: ProxiesPage })

function ProxiesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")

  const query = useQuery({
    queryKey: ["admin", "proxies", { search }],
    queryFn: async () => {
      const data = (await proxiesAPI.list(1, 20, { search: search || undefined })) as unknown as { items?: Array<{ id: number; name: string; url: string }> }
      return data.items ?? (data as unknown as Array<{ id: number; name: string; url: string }>)
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: { name: string; url: string }) => proxiesAPI.create(data as unknown as { protocol: string; host: string; port: number }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "proxies"] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => proxiesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "proxies"] }),
  })

  const rows = (query.data as Array<{ id: number; name: string; url: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.proxies.title"
          action={
            <Button onClick={() => createMut.mutate({ name: "New proxy", url: "http://proxy.example.com:8080" })} disabled={createMut.isPending}>
              Create
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
              { header: "Name", accessorKey: "name" },
              { header: "URL", accessorKey: "url" },
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
            error={query.isError ? "Failed to load proxies" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No proxies"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
