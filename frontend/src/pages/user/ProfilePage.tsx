import { toast } from "sonner"
import { useEffect, useState } from "react"
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
import { Eye, EyeOff, Loader2 } from "lucide-react"

const schema = z.object({ username: z.string().min(1), email: z.string().email() })
type V = z.infer<typeof schema>
const pwSchema = z.object({ old_password: z.string().min(1), new_password: z.string().min(6) })
type PW = z.infer<typeof pwSchema>

export function ProfilePage() {
  const qc = useQueryClient()
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => (await httpClient.get("/user/profile")).data as V & { id: number },
  })
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { username: "", email: "" } })
  const pwForm = useForm<PW>({ resolver: zodResolver(pwSchema), defaultValues: { old_password: "", new_password: "" } })
  useEffect(() => { if (data) form.reset({ username: (data as { username?: string }).username ?? "", email: (data as { email?: string }).email ?? "" }) }, [data, form])
  const mut = useMutation({
    mutationFn: async (v: V) => (await httpClient.put("/user/profile", v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user-profile"] }); toast.success("Profile updated") },
    onError: (e) => toast.error((e as Error).message),
  })
  const pwMut = useMutation({
    mutationFn: async (v: PW) => (await httpClient.put("/user/password", v)).data,
    onSuccess: () => { toast.success("Password updated"); pwForm.reset() },
    onError: (e) => toast.error((e as Error).message),
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
                <Button type="submit" disabled={mut.isPending}>{mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="rounded-none mt-6">
            <CardHeader><CardTitle className="text-sm">Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={pwForm.handleSubmit((v) => pwMut.mutate(v))} className="space-y-3">
                <div className="space-y-1"><Label>Current password</Label>
                  <div className="relative"><Input type={showOld ? "text" : "password"} {...pwForm.register("old_password")} className="pr-10" />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><span>{showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</span></button>
                  </div>
                </div>
                <div className="space-y-1"><Label>New password</Label>
                  <div className="relative"><Input type={showNew ? "text" : "password"} {...pwForm.register("new_password")} className="pr-10" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
                <Button type="submit" disabled={pwMut.isPending} className="w-full">{pwMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}</Button>
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
                  <Button size="sm" variant="outline" onClick={async () => { const r = await httpClient.post("/user/totp/setup", {}); toast.info(JSON.stringify(r.data)) }}>Setup TOTP</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await httpClient.post("/user/totp/disable", {}); totpQ.refetch(); toast.success("TOTP disabled") }}>Disable</Button>
                </div>
              </div>
              <div>
                <p className="font-medium">Passkeys</p>
                <p className="text-muted-foreground text-xs">{Array.isArray(passkeysQ.data) ? `${(passkeysQ.data as unknown[]).length} passkeys` : JSON.stringify(passkeysQ.data ?? "none")}</p>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={async () => { const b = await httpClient.post("/user/passkeys/register/begin", {}); toast.info(JSON.stringify(b.data)) }}>Add Passkey</Button>
                  <Button size="sm" variant="outline" onClick={() => { passkeysQ.refetch(); toast.success("Refreshed") }}>Refresh</Button>
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
