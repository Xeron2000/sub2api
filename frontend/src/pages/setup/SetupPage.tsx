import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

const schema = z.object({
  db_host: z.string().min(1),
  db_port: z.number().int().min(1),
  db_user: z.string().min(1),
  db_password: z.string().min(1),
  db_name: z.string().min(1),
  redis_host: z.string().min(1),
  redis_port: z.number().int().min(1),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
})
type V = z.infer<typeof schema>

export function SetupPage() {
  const [status, setStatus] = useState<{ needs_setup: boolean } | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { db_host: "localhost", db_port: 5432, db_user: "postgres", db_password: "", db_name: "sub2api", redis_host: "localhost", redis_port: 6379, admin_email: "", admin_password: "" },
  })
  useEffect(() => {
    httpClient.get("/setup/status").then(r => setStatus(r.data as { needs_setup: boolean })).catch(e => setError((e as Error).message)).finally(() => setChecking(false))
  }, [])
  const testDb = async () => {
    const v = form.getValues()
    await httpClient.post("/setup/test-db", { host: v.db_host, port: v.db_port, user: v.db_user, password: v.db_password, dbname: v.db_name })
    alert("Database connection OK")
  }
  const testRedis = async () => {
    const v = form.getValues()
    await httpClient.post("/setup/test-redis", { host: v.redis_host, port: v.redis_port })
    alert("Redis connection OK")
  }
  const onSubmit = async (v: V) => {
    setError(null)
    try {
      await httpClient.post("/setup/install", {
        database: { host: v.db_host, port: v.db_port, user: v.db_user, password: v.db_password, dbname: v.db_name },
        redis: { host: v.redis_host, port: v.redis_port },
        admin: { email: v.admin_email, password: v.admin_password },
      })
      setDone(true)
    } catch (e) { setError((e as Error).message) }
  }
  if (checking) return <LoadingState />
  if (error && !status) return <ErrorState message={error} onRetry={() => location.reload()} />
  if (status && !status.needs_setup) return <Page><PageHeader title="Setup" description="System already installed." /><Section><Card className="rounded-none"><CardContent className="p-6 text-sm">No setup required. Go to <a href="/login" className="underline">Login</a>.</CardContent></Card></Section></Page>
  if (done) return <Page><PageHeader title="Setup" description="Installation completed." /><Section><Card className="rounded-none"><CardContent className="p-6 text-sm">Admin created. Please restart the service and <a href="/login" className="underline">login</a>.</CardContent></Card></Section></Page>
  return (
    <Page>
      <PageHeader title="System Setup" description="Configure database, Redis and administrator account." />
      <Section>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1"><Label>DB Host</Label><Input {...form.register("db_host")} /></div>
            <div className="space-y-1"><Label>DB Port</Label><Input type="number" {...form.register("db_port", { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>DB User</Label><Input {...form.register("db_user")} /></div>
            <div className="space-y-1"><Label>DB Name</Label><Input {...form.register("db_name")} /></div>
            <div className="space-y-1"><Label>DB Password</Label><Input type="password" {...form.register("db_password")} /></div>
            <div className="space-y-1"><Label>Redis Host</Label><Input {...form.register("redis_host")} /></div>
            <div className="space-y-1"><Label>Redis Port</Label><Input type="number" {...form.register("redis_port", { valueAsNumber: true })} /></div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={testDb}>Test Database</Button>
            <Button type="button" variant="outline" onClick={testRedis}>Test Redis</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1"><Label>Admin Email</Label><Input {...form.register("admin_email")} />{form.formState.errors.admin_email && <p className="text-destructive text-xs">{form.formState.errors.admin_email.message}</p>}</div>
            <div className="space-y-1"><Label>Admin Password</Label><Input type="password" {...form.register("admin_password")} />{form.formState.errors.admin_password && <p className="text-destructive text-xs">{form.formState.errors.admin_password.message}</p>}</div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Installing..." : "Install"}</Button>
        </form>
      </Section>
    </Page>
  )
}
