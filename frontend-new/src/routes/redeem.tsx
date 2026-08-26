import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth"
import { useTranslation } from "@/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { queryKeys } from "@/lib/query/keys"
import { redeemCode, getRedeemHistory } from "@/lib/api/redeem"
import { getAppErrorMessage } from "@/lib/api/errors"
import { formatMoney, formatDateTime } from "@/lib/format"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/redeem")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAuthStatus() === "anonymous") {
      throw redirect({ to: "/login", search: { redirect: "/redeem" } as Record<string, string> })
    }
  },
  component: RedeemPage,
})

const schema = z.object({ code: z.string().min(1) })
type FormData = z.infer<typeof schema>

function RedeemPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  })

  const historyQuery = useQuery({
    queryKey: queryKeys.redeem.history(),
    queryFn: ({ signal }) => getRedeemHistory({ signal }),
  })

  const mutation = useMutation({
    mutationFn: ({ code }: FormData) => redeemCode(code),
    onSuccess: (data) => {
      const msg = data.message || t("redeem.success") || "Redeemed successfully"
      setSuccessMsg(msg)
      setFormError(null)
      form.reset()
      toast.success(msg)
      qc.invalidateQueries({ queryKey: queryKeys.redeem.history() })
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
    onError: (err) => {
      setFormError(getAppErrorMessage(err))
      setSuccessMsg(null)
    },
  })

  const onSubmit = (values: FormData) => {
    setFormError(null)
    setSuccessMsg(null)
    mutation.mutate(values)
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader titleKey="redeem.title" descriptionKey="redeem.description" />

        <div className="mt-6 max-w-2xl space-y-6">
          {/* Balance hint card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {t("redeem.hint") || "Enter a redeem code to add balance or subscription time to your account."}
              </p>
            </CardContent>
          </Card>

          {/* Redeem form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("redeem.redeemCodeLabel") || "Redeem Code"}</CardTitle>
              <CardDescription>{t("redeem.redeemCodeHint") || "Codes are case-sensitive."}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="redeem-code">{t("redeem.redeemCodeLabel") || "Code"}</Label>
                  <Input
                    id="redeem-code"
                    placeholder={t("redeem.redeemCodePlaceholder") || "Enter code"}
                    {...form.register("code")}
                    aria-invalid={!!form.formState.errors.code}
                    aria-describedby={form.formState.errors.code ? "redeem-code-error" : undefined}
                    autoComplete="off"
                  />
                  {form.formState.errors.code && (
                    <p id="redeem-code-error" className="text-sm text-destructive">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}
                {successMsg && (
                  <p role="status" className="text-sm text-green-600 dark:text-green-400">
                    {successMsg}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={mutation.isPending} aria-busy={mutation.isPending}>
                  {mutation.isPending ? (t("redeem.redeeming") || "Redeeming...") : (t("redeem.redeemButton") || "Redeem")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("redeem.recentActivity") || "Recent activity"}</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <LoadingState />
              ) : historyQuery.isError ? (
                <ErrorState message={getAppErrorMessage(historyQuery.error)} onRetry={() => historyQuery.refetch()} />
              ) : !historyQuery.data?.length ? (
                <EmptyState
                  title={t("redeem.emptyHistoryTitle") || "No redeem history"}
                  description={t("redeem.historyWillAppear") || "Your redeemed codes will appear here."}
                />
              ) : (
                <div className="space-y-2">
                  {historyQuery.data.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {item.type === "balance" || item.type === "admin_balance"
                            ? formatMoney(item.value)
                            : item.type === "subscription"
                              ? `${item.validity_days ?? item.value} days${item.group?.name ? ` — ${item.group.name}` : ""}`
                              : `${item.value} requests`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.type} · {formatDateTime(item.used_at)}
                        </p>
                        {item.notes && <p className="text-xs italic text-muted-foreground truncate max-w-[260px]">{item.notes}</p>}
                      </div>
                      <code className="text-xs text-muted-foreground">{item.code.slice(0, 8)}...</code>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}
