import { toast } from "sonner"
import { useEffect } from "react"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"
import { Loader2 } from "lucide-react"

const schema = z.object({
  site_name: z.string().min(1),
  site_url: z.string().optional(),
  registration_enabled: z.boolean().optional(),
  payment_enabled: z.boolean().optional(),
  totp_enabled: z.boolean().optional(),
  passkey_enabled: z.boolean().optional(),
  affiliate_enabled: z.boolean().optional(),
  risk_control_enabled: z.boolean().optional(),
})
type V = z.infer<typeof schema>

function SwitchRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function SettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await httpClient.get("/admin/settings")).data as Record<string, unknown> })
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { site_name: "" } })
  useEffect(() => {
    if (data) form.reset({
      site_name: (data as { site_name?: string }).site_name ?? "",
      site_url: (data as { site_url?: string }).site_url ?? "",
      registration_enabled: Boolean((data as { registration_enabled?: boolean }).registration_enabled),
      payment_enabled: Boolean((data as { payment_enabled?: boolean }).payment_enabled),
      totp_enabled: Boolean((data as { totp_enabled?: boolean }).totp_enabled),
      passkey_enabled: Boolean((data as { passkey_enabled?: boolean }).passkey_enabled),
      affiliate_enabled: Boolean((data as { affiliate_enabled?: boolean }).affiliate_enabled),
      risk_control_enabled: Boolean((data as { risk_control_enabled?: boolean }).risk_control_enabled),
    })
  }, [data, form])
  const mut = useMutation({
    mutationFn: async (v: V) => (await httpClient.put("/admin/settings", v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Settings saved") },
    onError: (e) => toast.error((e as Error).message),
  })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  return (
    <Page>
      <PageHeader title="System Settings" description="Five categories — all fields submit to /admin/settings." />
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Section title="General">
            <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Site Branding</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="max-w-md space-y-4">
                  <div className="space-y-1"><Label>Site name</Label><Input {...form.register("site_name")} /><p className="text-xs text-muted-foreground">Displayed in header and login branding.</p></div>
                  <div className="space-y-1"><Label>Site URL</Label><Input {...form.register("site_url")} /><p className="text-xs text-muted-foreground">Used for callbacks and emails.</p></div>
                  <Button type="submit" disabled={mut.isPending}>{mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save changes"}</Button>
                </form>
              </CardContent>
            </Card>
          </Section>
        </TabsContent>
        <TabsContent value="auth">
          <Section title="Authentication">
            <Card className="rounded-none"><CardContent className="p-4 space-y-1">
              <SwitchRow label="TOTP Two-Factor" description="Require authenticator app for sensitive operations." checked={!!form.watch("totp_enabled")} onChange={(c) => form.setValue("totp_enabled", c)} />
              <SwitchRow label="Passkey (WebAuthn)" description="Allow passwordless login via platform authenticators." checked={!!form.watch("passkey_enabled")} onChange={(c) => form.setValue("passkey_enabled", c)} />
              <SwitchRow label="Registration Enabled" description="Allow new users to self-register. Disable for invite-only." checked={!!form.watch("registration_enabled")} onChange={(c) => form.setValue("registration_enabled", c)} />
              <Button onClick={form.handleSubmit((v) => mut.mutate(v))} disabled={mut.isPending} className="mt-2">{mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Auth Settings"}</Button>
            </CardContent></Card>
          </Section>
        </TabsContent>
        <TabsContent value="payments">
          <Section title="Payments"><Card className="rounded-none"><CardContent className="p-4 space-y-1">
            <SwitchRow label="Payments Enabled" description="Enable Stripe / Airwallex / Alipay / WeChat checkout flows." checked={!!form.watch("payment_enabled")} onChange={(c) => form.setValue("payment_enabled", c)} />
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))} disabled={mut.isPending} className="mt-2">{mut.isPending ? "Saving..." : "Save Payment Settings"}</Button>
          </CardContent></Card></Section>
        </TabsContent>
        <TabsContent value="security">
          <Section title="Security"><Card className="rounded-none"><CardContent className="p-4 space-y-1">
            <SwitchRow label="Risk Control" description="Enable content moderation and prompt filtering pipeline." checked={!!form.watch("risk_control_enabled")} onChange={(c) => form.setValue("risk_control_enabled", c)} />
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))} disabled={mut.isPending} className="mt-2">{mut.isPending ? "Saving..." : "Save Security"}</Button>
          </CardContent></Card></Section>
        </TabsContent>
        <TabsContent value="features">
          <Section title="Features"><Card className="rounded-none"><CardContent className="p-4 space-y-1">
            <SwitchRow label="Affiliate Program" description="Enable invite rebates and transfer to balance." checked={!!form.watch("affiliate_enabled")} onChange={(c) => form.setValue("affiliate_enabled", c)} />
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))} disabled={mut.isPending} className="mt-2">{mut.isPending ? "Saving..." : "Save Features"}</Button>
          </CardContent></Card></Section>
        </TabsContent>
      </Tabs>
    </Page>
  )
}
