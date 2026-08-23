import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { httpClient } from "@/api/client/http-client"
import { userKeys } from "@/api/query-keys"
import { Page, PageHeader, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type UserRow = { id: number; email: string; role: string; status: string; created_at: string }

const columns: ColumnDef<UserRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "admin" ? "info" : "neutral"}>{getValue<string>()}</StatusBadge> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "active" ? "success" : "error"}>{getValue<string>()}</StatusBadge> },
  { accessorKey: "created_at", header: "Created" },
  { id: "actions", header: "Actions", cell: () => <Button variant="ghost" size="sm">View</Button> },
]

export function UsersPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userKeys.list({ search }),
    queryFn: async () => {
      const res = await httpClient.get<{ items: UserRow[] }>("/admin/users", { params: { search, page: 1, page_size: 20 } })
      const d = res.data as { items?: UserRow[] } | UserRow[]
      if (Array.isArray(d)) return d as UserRow[]
      return (d as { items?: UserRow[] }).items ?? []
    },
  })

  return (
    <Page>
      <PageHeader title="User Management" description="Manage users, access and account status." actions={<Button>Create user</Button>} />
      <Toolbar>
        <Input placeholder="Search email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
      </Toolbar>
      <DataTable
        data={data ?? []}
        columns={columns}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        onRetry={() => refetch()}
        emptyTitle="No users yet"
        emptyDescription="Create a user to get started."
      />
    </Page>
  )
}
