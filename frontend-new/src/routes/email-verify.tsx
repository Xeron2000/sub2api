import { createFileRoute, Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthShell } from "@/components/layout/AppShell"
import { apiClient, getErrorMessage } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"

export const Route = createFileRoute("/email-verify")({ component: EmailVerifyPage })

const schema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().min(1, "Code required"),
})
type FormData = z.infer<typeof schema>

function EmailVerifyPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resendError, setResendError] = useState<string | null>(null)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", code: "" } })

  // Cooldown tick per §10
  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  // Prefill email from sessionStorage pending session if present
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("register_data")
      if (pending) {
        const d = JSON.parse(pending) as { email?: string }
        if (d.email) form.setValue("email", d.email)
      }
    } catch {}
  }, [form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post("/auth/verify-email", data)
      return res.data
    },
    onSuccess: () => setSuccess("Email verified successfully. You can now sign in."),
    onError: (err) => {
      const msg = getErrorMessage(err)
      // Map backend codes to distinct UI per §10: expired/wrong/already verified
      if (/expired/i.test(msg)) setError("Code expired, please resend.")
      else if (/already.*verified/i.test(msg)) setError("Already verified, please sign in.")
      else if (/wrong|invalid|incorrect/i.test(msg)) setError("Wrong code, please try again.")
      else setError(msg)
    },
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      const email = form.getValues("email")
      if (!email) throw new Error("Email required")
      const res = await apiClient.post("/auth/send-code", { email })
      return res.data
    },
    onSuccess: () => {
      setCooldown(60)
      setResendError(null)
      setSuccess("Code sent")
    },
    onError: (err) => setResendError(getErrorMessage(err)),
  })

  void queryKeys.auth.currentUser()

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Verify email</CardTitle>
          <CardDescription>Enter the code sent to your email</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input id="code" {...form.register("code")} placeholder="123456" />
              {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}
            {resendError && <p role="alert" className="text-sm text-destructive">{resendError}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Verifying..." : "Verify"}
            </Button>
            <div className="flex justify-center">
              <Button type="button" variant="ghost" size="sm" disabled={cooldown > 0 || resendMutation.isPending} onClick={() => resendMutation.mutate()}>
                {resendMutation.isPending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
