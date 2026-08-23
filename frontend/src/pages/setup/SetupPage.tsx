import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
type V = z.infer<typeof schema>

export function SetupPage() {
  const [done, setDone] = useState(false)
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })
  const onSubmit = async (v: V) => {
    await httpClient.post("/setup", v)
    setDone(true)
  }
  return (
    <Page>
      <PageHeader title="Setup" description="First-run initialization." />
      <Section>
        {done ? <Card className="rounded-none"><CardContent className="p-6 text-sm">Setup completed. Please restart and login.</CardContent></Card> : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
            <div className="space-y-1"><Label>Email</Label><Input {...form.register("email")} />{form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}</div>
            <div className="space-y-1"><Label>Password</Label><Input type="password" {...form.register("password")} />{form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}</div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Initialize</Button>
          </form>
        )}
      </Section>
    </Page>
  )
}
