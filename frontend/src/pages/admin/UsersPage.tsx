import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { httpClient } from "@/api/client/http-client"
import { userKeys } from "@/api/query-keys"
import { Page, PageHeader, Toolbar } from "@/components/shared/Page"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTableUrlState } from "@/hooks/useTableUrlState"
import { t } from "@/i18n"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

type UserRow = { id: number; email: string; role: string; status: string; created_at: string }

const columns: ColumnDef<UserRow>[] = [
  { accessorKey: "id", header: "ID", enableSorting: true },
  { accessorKey: "email", header: "Email", enableSorting: true },
  { accessorKey: "role", header: "Role", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "admin" ? "info" : "neutral"}>{getValue<string>()}</StatusBadge> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>() === "active" ? "success" : "error"}>{getValue<string>()}</StatusBadge> },
  { accessorKey: "created_at", header: "Created", enableSorting: true },
]

const userSchema = z.object({
  email: z.string().email(t("admin.users.title")),
  role: z.enum(["user", "admin"]),
})
type UserFormValues = z.infer<typeof userSchema>

function UserSheet({ open, onOpenChange, initial, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Partial<UserFormValues>; onSubmit: (v: UserFormValues) => void }) {
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { email: initial?.email ?? "", role: (initial?.role as "user" | "admin") ?? "user" } })
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{initial ? "Edit user" : "Create user"}</SheetTitle>
          <SheetDescription>Manage users, access and account status.</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select {...form.register("role")} className="border-input bg-background flex h-8 w-full rounded-none border px-2 text-sm">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function UsersPage() {
  const { pagination, sorting, search, setPagination, setSorting, setSearch } = useTableUrlState({ pageSize: 20 })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userKeys.list({ search, page: pagination.pageIndex + 1, pageSize: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined }),
    queryFn: async () => {
      const res = await httpClient.get<{ items: UserRow[] }>("/admin/users", {
        params: { search, page: pagination.pageIndex + 1, page_size: pagination.pageSize, sort: sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : undefined },
      })
      const d = res.data as { items?: UserRow[] } | UserRow[]
      if (Array.isArray(d)) return d as UserRow[]
      return (d as { items?: UserRow[] }).items ?? []
    },
  })

  const tableColumns: ColumnDef<UserRow>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">⋯</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditing(row.original); setSheetOpen(true) }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(null)}>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(row.original)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleCreate = () => { setEditing(null); setSheetOpen(true) }
  const handleSubmit = (values: UserFormValues) => {
    // would POST /admin/users or PUT /admin/users/:id
    console.log("submit user", editing?.id, values)
    setSheetOpen(false)
  }
  const handleDelete = () => {
    console.log("delete", deleteTarget?.id)
    setDeleteTarget(null)
  }

  return (
    <Page>
      <PageHeader title={t("admin.users.title")} description={t("admin.users.description")} actions={<Button onClick={handleCreate}>Create user</Button>} />
      <Toolbar>
        <Input placeholder="Search email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
      </Toolbar>
      <DataTable
        data={data ?? []}
        columns={tableColumns}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        onRetry={() => refetch()}
        pagination={pagination}
        sorting={sorting}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        emptyTitle="No users yet"
        emptyDescription="Create a user to get started."
      />
      <UserSheet open={sheetOpen} onOpenChange={setSheetOpen} initial={editing ? { email: editing.email, role: editing.role as "user"|"admin" } : undefined} onSubmit={handleSubmit} />
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user &quot;{deleteTarget?.email}&quot;?</DialogTitle>
            <DialogDescription>This will permanently remove the user. Requests using their keys will stop working.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
