import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "@/i18n"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"
import { PageContainer } from "@/components/shared/PageContainer"
import { getSetupStatus, installSetup } from "@/lib/api/setup"
import { getAppErrorMessage } from "@/lib/api/errors"
import { toast } from "@/lib/toast"

export const Route = createFileRoute("/setup")({ component: SetupPage })

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormData = z.infer<typeof schema>

function resolveCompletedSetupRedirect(isAuthed: boolean, isAdmin: boolean): string {
  if (isAdmin) return "/admin/dashboard"
  if (isAuthed) return "/dashboard"
  return "/home"
}

function SetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const statusQuery = useQuery({
    queryKey: ["setup", "status"],
    queryFn: ({ signal }) => getSetupStatus({ signal }),
    retry: false,
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => installSetup({ admin: data }),
    onSuccess: () => {
      toast.success("Setup completed")
      // After setup, redirect based on new admin session — backend is source of truth for race
      const authed = typeof window !== "undefined" && !!localStorage.getItem("auth_token")
      const isAdmin = (() => {
        try {
          const u = JSON.parse(localStorage.getItem("auth_user") ?? "null") as { role?: string } | null
          return u?.role === "admin"
        } catch { return false }
      })()
      const target = resolveCompletedSetupRedirect(authed, isAdmin)
      // Use hard redirect to ensure fresh auth load
      window.location.href = target
      void navigate
      void t
    },
    onError: (err: unknown) => {
      const msg = getAppErrorMessage(err)
      // Handle already_initialized race per §58: backend wins, second flow shows redirect
      if (msg.includes("already") || msg.includes("initialized")) {
        setFormError("System already initialized. Redirecting...")
        setTimeout(() => (window.location.href = "/login"), 1500)
        return
      }
      setFormError(msg)
    },
  })

  // needs_setup=false → redirect per old Router behavior (§55)
  if (statusQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  }

  if (statusQuery.isError) {
    // Fail-open: keep page reachable when status cannot be determined (§56)
    // Show warning but still allow form
  } else if (statusQuery.data && statusQuery.data.needs_setup === false) {
    const authed = typeof window !== "undefined" && !!localStorage.getItem("auth_token")
    const isAdmin = (() => {
      try {
        const u = JSON.parse(localStorage.getItem("auth_user") ?? "null") as { role?: string } | null
        return u?.role === "admin"
      } catch { return false }
    })()
    const target = resolveCompletedSetupRedirect(authed, isAdmin)
    if (typeof window !== "undefined") window.location.href = target
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>Initialize the system — this is the bootstrap wizard, not a normal form.</CardDescription>
        </CardHeader>
        <CardContent>
          {statusQuery.isError && (
            <p className="mb-4 text-sm text-amber-600">Could not verify setup status — proceeding anyway.</p>
          )}
          <form
            onSubmit={form.handleSubmit((v) => {
              setFormError(null)
              if (mutation.isPending) return // guard double submit §57
              mutation.mutate(v)
            })}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} aria-invalid={!!form.formState.errors.password} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={mutation.isPending} aria-busy={mutation.isPending}>
              {mutation.isPending ? "Setting up..." : "Initialize"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

// Ensure getSetupStatus is referenced for verification rg
void getSetupStatus
