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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); alert("Settings saved") },
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
            <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Site</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="max-w-md space-y-4">
                  <div className="space-y-1"><Label>Site name</Label><Input {...form.register("site_name")} /></div>
                  <div className="space-y-1"><Label>Site URL</Label><Input {...form.register("site_url")} /></div>
                  <Button type="submit" disabled={mut.isPending}>Save changes</Button>
                </form>
              </CardContent>
            </Card>
          </Section>
        </TabsContent>
        <TabsContent value="auth">
          <Section title="Authentication">
            <Card className="rounded-none"><CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between"><Label>TOTP Enabled</Label><Switch checked={!!form.watch("totp_enabled")} onCheckedChange={(c) => form.setValue("totp_enabled", c)} /></div>
              <div className="flex items-center justify-between"><Label>Passkey Enabled</Label><Switch checked={!!form.watch("passkey_enabled")} onCheckedChange={(c) => form.setValue("passkey_enabled", c)} /></div>
              <div className="flex items-center justify-between"><Label>Registration Enabled</Label><Switch checked={!!form.watch("registration_enabled")} onCheckedChange={(c) => form.setValue("registration_enabled", c)} /></div>
              <Button onClick={form.handleSubmit((v) => mut.mutate(v))}>Save Auth Settings</Button>
            </CardContent></Card>
          </Section>
        </TabsContent>
        <TabsContent value="payments">
          <Section title="Payments"><Card className="rounded-none"><CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><Label>Payments Enabled</Label><Switch checked={!!form.watch("payment_enabled")} onCheckedChange={(c) => form.setValue("payment_enabled", c)} /></div>
            <p className="text-xs text-muted-foreground">Stripe / Airwallex / Alipay / WeChat configured via /admin/payment and /admin/settings.</p>
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))}>Save Payment Settings</Button>
          </CardContent></Card></Section>
        </TabsContent>
        <TabsContent value="security">
          <Section title="Security"><Card className="rounded-none"><CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><Label>Risk Control</Label><Switch checked={!!form.watch("risk_control_enabled")} onCheckedChange={(c) => form.setValue("risk_control_enabled", c)} /></div>
            <p className="text-xs text-muted-foreground">Toggles prompt audit and content filtering. Detailed rules at /admin/risk-control/config.</p>
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))}>Save Security</Button>
          </CardContent></Card></Section>
        </TabsContent>
        <TabsContent value="features">
          <Section title="Features"><Card className="rounded-none"><CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><Label>Affiliate Enabled</Label><Switch checked={!!form.watch("affiliate_enabled")} onCheckedChange={(c) => form.setValue("affiliate_enabled", c)} /></div>
            <Button onClick={form.handleSubmit((v) => mut.mutate(v))}>Save Features</Button>
          </CardContent></Card></Section>
        </TabsContent>
      </Tabs>
    </Page>
  )
}
