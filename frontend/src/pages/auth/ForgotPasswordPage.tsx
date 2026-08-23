import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const schema = z.object({ email: z.string().email() })
type V = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { email: "" } })
  const onSubmit = async (v: V) => { await httpClient.post("/auth/forgot-password", v); toast.success("If the email exists, a reset link has been sent") }
  return (
    <Page>
      <PageHeader title="Forgot Password" description="Request a reset link." />
      <Section>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-1"><Label>Email</Label><Input {...form.register("email")} />{form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send reset link"}</Button>
        </form>
      </Section>
    </Page>
  )
}
