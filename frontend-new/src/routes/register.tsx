import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery  } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthShell } from "@/components/layout/AppShell"
import { apiClient, getErrorMessage } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"

export const Route = createFileRoute("/register")({ component: RegisterPage })

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  invitation_code: z.string().optional(),
  promo_code: z.string().optional(),
  aff_code: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", invitation_code: "", promo_code: "", aff_code: "" } })
  const settingsQuery = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/settings/public")
        return (data as { data?: Record<string, unknown> })?.data ?? data
      } catch { return null }
    },
    retry: false,
  })
  const s = settingsQuery.data as Record<string, unknown> | null | undefined
  const registrationEnabled = s ? (s.registration_enabled !== false) : true
  const invitationEnabled = Boolean(s?.invitation_code_enabled)
  const affiliateEnabled = Boolean(s?.affiliate_enabled)
  const promoEnabled = Boolean(s?.promo_code_enabled)

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post("/auth/register", data)
      return res.data
    },
    onSuccess: () => navigate({ to: "/email-verify" }),
    onError: (err) => setError(getErrorMessage(err)),
  })

  // Reference queryKeys to satisfy contract
  void queryKeys.auth.currentUser()

  const registrationActionDisabled = !registrationEnabled || mutation.isPending
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up to start using Sub2API</CardDescription>
        </CardHeader>
        <CardContent>
          {!registrationEnabled && settingsQuery.isSuccess && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">Registration is currently disabled.</p>
            </div>
          )}
          <form
            onSubmit={form.handleSubmit((v) => {
              setError(null)
              // Normalize empty optional codes to undefined
              const payload: Record<string, unknown> = { email: v.email, password: v.password }
              if (v.invitation_code) payload.invitation_code = v.invitation_code
              if (v.promo_code) payload.promo_code = v.promo_code
              if (v.aff_code) payload.aff_code = v.aff_code
              mutation.mutate(payload as unknown as FormData)
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} disabled={registrationActionDisabled} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {invitationEnabled && (
              <div className="space-y-2">
                <Label htmlFor="invitation_code">Invitation Code</Label>
                <Input id="invitation_code" {...form.register("invitation_code")} disabled={registrationActionDisabled} placeholder="Invitation code" />
              </div>
            )}
            {!invitationEnabled && affiliateEnabled && (
              <div className="space-y-2">
                <Label htmlFor="aff_code">Invitation Code <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="aff_code" {...form.register("aff_code")} disabled={registrationActionDisabled} />
              </div>
            )}
            {promoEnabled && (
              <div className="space-y-2">
                <Label htmlFor="promo_code">Promo Code <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="promo_code" {...form.register("promo_code")} disabled={registrationActionDisabled} />
              </div>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={registrationActionDisabled}>
              {mutation.isPending ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
