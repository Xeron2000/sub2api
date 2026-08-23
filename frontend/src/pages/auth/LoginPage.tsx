import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { httpClient } from "@/api/client/http-client"

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
})

type Values = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })

  const onSubmit = async (values: Values) => {
    try {
      const res = await httpClient.post("/auth/login", values)
      const data = res.data as { token?: string; access_token?: string; refresh_token?: string; user?: unknown }
      const token = data.token || data.access_token
      if (token) localStorage.setItem("auth_token", token)
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token)
      if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user))
      navigate("/dashboard")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed"
      form.setError("root", { message: msg })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm rounded-none">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}
            </div>
            {form.formState.errors.root && <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
