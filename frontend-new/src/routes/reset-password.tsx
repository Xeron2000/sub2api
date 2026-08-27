import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
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

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage })

const schema = z.object({
  token: z.string().min(1, "Token required"),
  password: z.string().min(6, "At least 6 characters"),
})
type FormData = z.infer<typeof schema>

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [invalidLink, setInvalidLink] = useState(false)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { token: "", password: "" } })

  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const t = p.get("token") ?? p.get("code") ?? ""
    if (t) form.setValue("token", t)
  }, [form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post("/auth/reset-password", data)
      return res.data
    },
    onSuccess: () => navigate({ to: "/login" }),
    onError: (err) => {
      const msg = getErrorMessage(err)
      if (/expired/i.test(msg)) setError("Link expired, please request a new reset link.")
      else if (/invalid|wrong|incorrect/i.test(msg)) {
        setError("Invalid reset link.")
        setInvalidLink(true)
      } else setError(msg)
    },
  })

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter token and new password</CardDescription>
        </CardHeader>
        <CardContent>
          {invalidLink && (
            <div role="alert" className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-200">
              This reset link is invalid or expired. Please request a new one. <Link to="/forgot-password" className="ml-2 text-primary hover:underline">Request new link</Link>
            </div>
          )}
          <form
            onSubmit={form.handleSubmit((v) => {
              setError(null)
              mutation.mutate(v)
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="token">Reset token</Label>
              <Input id="token" {...form.register("token")} />
              {form.formState.errors.token && <p className="text-sm text-destructive">{form.formState.errors.token.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Resetting..." : "Reset password"}
            </Button>
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
