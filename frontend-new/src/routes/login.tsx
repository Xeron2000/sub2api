import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthShell } from "@/components/layout/AppShell"
import { login, persistAuthTokens, clearAuth } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/client"
import { toAppError } from "@/lib/api/errors"
import { queryKeys } from "@/lib/query/keys"
import { useState, useMemo } from "react"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
      // already authenticated, go to dashboard - but allow explicit login page visit
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> })
  const redirect = typeof search.redirect === "string" ? search.redirect : "/dashboard"
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("common.emailRequired") || "Email required").email(t("common.invalidEmail")),
        password: z.string().min(1, t("common.passwordRequired") || "Password required"),
      }),
    [t],
  )
  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      persistAuthTokens(data)
      qc.setQueryData(queryKeys.auth.currentUser(), data.user)
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
      navigate({ to: redirect })
    },
    onError: (err) => {
      clearAuth()
      const appErr = toAppError(err)
      if (appErr.type === "validation" && appErr.metadata) {
        const fields = appErr.metadata as Record<string, string>
        for (const [k, msg] of Object.entries(fields)) {
          if (k in form.getValues()) form.setError(k as keyof FormData, { message: String(msg) })
        }
      }
      setError(getErrorMessage(err))
    },
  })

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>{t("home.login")}</CardTitle>
          <CardDescription>{t("auth.signInToAccount")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => {
              setError(null)
              mutation.mutate(v)
            })}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={mutation.isPending} aria-busy={mutation.isPending}>
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                  {t("common.loading")}
                </span>
              ) : (
                t("auth.signIn")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
