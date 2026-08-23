import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

const schema = z.object({ username: z.string().min(1), email: z.string().email() })
type V = z.infer<typeof schema>

export function ProfilePage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => (await httpClient.get("/user/profile")).data as V & { id: number },
  })
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { username: "", email: "" } })
  useEffect(() => { if (data) form.reset({ username: (data as { username?: string }).username ?? "", email: (data as { email?: string }).email ?? "" }) }, [data, form])
  const mut = useMutation({
    mutationFn: async (v: V) => (await httpClient.put("/user/profile", v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user-profile"] }); alert("Profile updated") },
  })
  const totpQ = useQuery({ queryKey: ["totp-status"], queryFn: async () => (await httpClient.get("/user/totp/status")).data, retry: false })
  const passkeysQ = useQuery({ queryKey: ["passkeys"], queryFn: async () => (await httpClient.get("/user/passkeys")).data, retry: false })
  const bindingsQ = useQuery({ queryKey: ["bindings"], queryFn: async () => (await httpClient.get("/user/account-bindings")).data, retry: false })
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
  return (
    <Page>
      <PageHeader title="Profile" description="Manage account, security and bindings." />
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Account">
          <Card className="rounded-none">
            <CardHeader><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-3">
                <div className="space-y-1"><Label>Username</Label><Input {...form.register("username")} /></div>
                <div className="space-y-1"><Label>Email</Label><Input {...form.register("email")} /></div>
                <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : "Save"}</Button>
              </form>
            </CardContent>
          </Card>
        </Section>
        <Section title="Security Devices">
          <Card className="rounded-none">
            <CardHeader><CardTitle className="text-sm">TOTP / Passkey</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">TOTP</p>
                <p className="text-muted-foreground text-xs">Status: {JSON.stringify((totpQ.data as { enabled?: boolean })?.enabled ?? "unknown")}</p>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={async () => { const r = await httpClient.post("/user/totp/setup", {}); alert(JSON.stringify(r.data)) }}>Setup TOTP</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await httpClient.post("/user/totp/disable", {}); totpQ.refetch() }}>Disable</Button>
                </div>
              </div>
              <div>
                <p className="font-medium">Passkeys</p>
                <p className="text-muted-foreground text-xs">{Array.isArray(passkeysQ.data) ? `${(passkeysQ.data as unknown[]).length} passkeys` : JSON.stringify(passkeysQ.data ?? "none")}</p>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={async () => { const b = await httpClient.post("/user/passkeys/register/begin", {}); alert(JSON.stringify(b.data)) }}>Add Passkey</Button>
                  <Button size="sm" variant="outline" onClick={() => passkeysQ.refetch()}>Refresh</Button>
                </div>
              </div>
              <div>
                <p className="font-medium">Account Bindings</p>
                <pre className="text-xs bg-muted p-2 overflow-auto max-h-32">{JSON.stringify(bindingsQ.data ?? {}, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>
    </Page>
  )
}
