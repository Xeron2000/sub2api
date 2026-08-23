import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({ site_name: z.string().min(1) })
type V = z.infer<typeof schema>

export function SettingsPage() {
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await httpClient.get("/admin/settings")).data })
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { site_name: (data as { site_name?: string })?.site_name || "" } })
  const onSubmit = async (v: V) => { await httpClient.put("/admin/settings", v) }
  return (
    <Page>
      <PageHeader title="System Settings" description="Grouped semantically per backend capabilities." />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Section title="General">
            <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Site</CardTitle></CardHeader><CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
                <div className="space-y-1"><Label>Site name</Label><Input {...form.register("site_name")} /></div>
                <Button type="submit">Save changes</Button>
              </form>
            </CardContent></Card>
          </Section>
        </TabsContent>
        <TabsContent value="auth"><Section><Card className="rounded-none"><CardContent className="p-4 text-sm">OAuth providers, WebAuthn, TOTP — backed by /admin/settings & /admin/tls-fingerprint-profile</CardContent></Card></Section></TabsContent>
        <TabsContent value="payments"><Section><Card className="rounded-none"><CardContent className="p-4 text-sm">Stripe/Airwallex/Alipay/WeChat via /admin/payment</CardContent></Card></Section></TabsContent>
        <TabsContent value="security"><Section><Card className="rounded-none"><CardContent className="p-4 text-sm">Risk control / prompt audit toggles</CardContent></Card></Section></TabsContent>
        <TabsContent value="features"><Section><Card className="rounded-none"><CardContent className="p-4 text-sm">Feature flags — centrally resolved via settingService.</CardContent></Card></Section></TabsContent>
      </Tabs>
    </Page>
  )
}
