import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminPaymentAPI } from "@/lib/api/admin/payment"

export const Route = createFileRoute("/admin/orders/plans")({ component: PlansPage })

function PlanEditDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (data: { name: string; price: number }) => void }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Price</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ name, price: parseFloat(price) || 0 })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlansPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const query = useQuery({
    queryKey: ["admin", "orders", "plans"],
    queryFn: async () => {
      const { data } = await adminPaymentAPI.getPlans()
      const d = data as { items?: Array<{ id: number; name: string; price: number }> }
      return d.items ?? (data)
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: { name: string; price: number }) => adminPaymentAPI.createPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders", "plans"] }),
  })

  const rows = (query.data as Array<{ id: number; name: string; price: number }>) ?? []

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.paymentPlans" action={<Button onClick={() => setDialogOpen(true)}>{t("common.create")}</Button>} />
        <div className="mt-6">
          <DataTable
            columns={[
              { header: "ID", accessorKey: "id", align: "right" },
              { header: "Name", accessorKey: "name" },
              { header: "Price", accessorKey: "price", align: "right" },
            ]}
            data={rows}
            loading={query.isLoading}
            error={query.isError ? "Failed to load plans" : null}
            onRetry={() => query.refetch()}
            emptyTitle="No plans"
          />
        </div>
        <PlanEditDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={(data) => createMut.mutate(data)} />
      </PageContainer>
    </AdminShell>
  )
}