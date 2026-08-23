import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"

const schema = z.object({ password: z.string().min(6) })
type V = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""
  const [show, setShow] = useState(false)
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { password: "" } })
  const onSubmit = async (v: V) => { await httpClient.post("/auth/reset-password", { token, password: v.password }); toast.success("Password reset — please login") }
  return (
    <Page>
      <PageHeader title="Reset Password" />
      <Section>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <p className="text-xs text-muted-foreground">Token: {token ? "present" : "missing"}</p>
          <div className="space-y-1">
            <Label>New password</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} {...form.register("password")} className="pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</> : "Reset"}</Button>
        </form>
      </Section>
    </Page>
  )
}
