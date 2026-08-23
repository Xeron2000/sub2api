import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const schema = z.object({ email: z.string().email("Invalid email"), password: z.string().min(6, "At least 6"), verify_code: z.string().optional() })
type V = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })
  const sendCode = async () => {
    const email = form.getValues("email")
    if (!email) return form.setError("email", { message: "Email required" })
    await httpClient.post("/auth/send-verify-code", { email })
    setSent(true)
  }
  const onSubmit = async (v: V) => {
    await httpClient.post("/auth/register", { email: v.email, password: v.password, verify_code: v.verify_code })
    navigate("/login")
  }
  return (
    <Page>
      <PageHeader title="Create account" description="Register a new account." />
      <Section>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-1"><Label>Email</Label><Input {...form.register("email")} />{form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}</div>
          <div className="space-y-1"><Label>Password</Label><Input type="password" {...form.register("password")} />{form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}</div>
          <div className="space-y-1"><Label>Verify code</Label><div className="flex gap-2"><Input {...form.register("verify_code")} /><Button type="button" variant="outline" onClick={sendCode}>{sent ? "Sent" : "Send code"}</Button></div></div>
          <Button type="submit" className="w-full">Register</Button>
        </form>
      </Section>
    </Page>
  )
}
