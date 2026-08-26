import { createFileRoute, redirect } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, getErrorMessage } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"

export const Route = createFileRoute("/redeem")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("run_mode") || localStorage.getItem("auth_user")
      // Simple-mode gate: if user is in simple mode, redirect to dashboard (backend is truth, this is UX only)
      // We check via stored user role; actual gate is backend-enforced
      try {
        const user = JSON.parse(localStorage.getItem("auth_user") || "null")
        if (user?.is_simple_mode) throw redirect({ to: "/dashboard" })
      } catch {
        // ignore
      }
      void mode
    }
  },
  component: RedeemPage,
})

const schema = z.object({ code: z.string().min(1, "Code required") })
type FormData = z.infer<typeof schema>

function RedeemPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { code: "" } })

  const historyQuery = useQuery({
    queryKey: queryKeys.announcements.list(), // reuse, or use redeem history
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get("/redeem/history", { signal })
      return (data as Array<{ id: number; code: string; type: string; value: number; used_at: string }>) ?? []
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post("/redeem", { code: data.code })
      return res.data
    },
    onSuccess: (data) => {
      setSuccess((data as { message?: string })?.message ?? "Redeemed successfully")
      setError(null)
      form.reset()
      qc.invalidateQueries({ queryKey: ["redeem"] })
      historyQuery.refetch()
    },
    onError: (err) => {
      setError(getErrorMessage(err))
      setSuccess(null)
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="redeem.title" descriptionKey="redeem.description" />
        <div className="mt-6 max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Redeem code</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((v) => {
                  setError(null)
                  setSuccess(null)
                  mutation.mutate(v)
                })}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" placeholder={t("auth.verificationCode")} {...form.register("code")} />
                  {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Redeeming..." : "Redeem"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { header: "Code", accessorKey: "code" },
                  { header: "Type", accessorKey: "type" },
                  { header: "Value", accessorKey: "value", align: "right" },
                  { header: "Date", accessorKey: "used_at" },
                ]}
                data={(historyQuery.data as Record<string, unknown>[]) ?? []}
                loading={historyQuery.isLoading}
                error={historyQuery.isError ? "Failed to load history" : null}
                onRetry={() => historyQuery.refetch()}
                emptyTitle="No redeem history"
              />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}