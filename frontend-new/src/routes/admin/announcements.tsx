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
import { announcementsAPI } from "@/lib/api/admin/announcements"

export const Route = createFileRoute("/admin/announcements")({ component: AnnouncementsPage })

function AnnouncementsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")

  const query = useQuery({
    queryKey: ["admin", "announcements", { search }],
    queryFn: async () => {
      const data = (await announcementsAPI.list(1, 20, { search: search || undefined })) as unknown as { items?: Array<{ id: number; title: string; status: string }> }
      return data.items ?? (data as unknown as Array<{ id: number; title: string; status: string }>)
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: { title: string }) => announcementsAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "announcements"] }),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => announcementsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "announcements"] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => announcementsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "announcements"] }),
  })

  const readStatusMut = useMutation({
    mutationFn: async (id: number) => announcementsAPI.getReadStatus(id),
  })

  void updateMut
  void readStatusMut

  const rows = (query.data as Array<{ id: number; title: string; status: string }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.announcements.title"
          action={
            <Button onClick={() => createMut.mutate({ title: "New announcement" })} disabled={createMut.isPending}>
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
              { header: "Title", accessorKey: "title" },
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
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load announcements" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No announcements"
          />
        </div>
      </PageContainer>
    </AdminShell>
  )
}
