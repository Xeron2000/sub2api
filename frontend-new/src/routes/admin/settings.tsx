import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AdminShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage })

function SettingsPage() {
  const qc = useQueryClient()
  const [siteName, setSiteName] = useState("")
  const [emailTemplate, setEmailTemplate] = useState("")

  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/settings")
      const d = data as { site_name?: string; email_template?: string }
      if (d.site_name) setSiteName(d.site_name)
      if (d.email_template) setEmailTemplate(d.email_template)
      return d
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: { site_name: string; email_template: string }) => apiClient.put("/admin/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  })

  return (
    <AdminShell>
      <PageContainer>
        <PageHeader titleKey="admin.settings.title" />
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Sub2API" />
              </div>
              <Button onClick={() => mutation.mutate({ site_name: siteName, email_template: emailTemplate })} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
              {query.isError && <p className="text-sm text-destructive">Failed to load settings</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Verification Email</Label>
                <Textarea id="emailTemplate" value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={6} placeholder="Hello {{name}}..." />
              </div>
              <Button variant="outline" onClick={() => mutation.mutate({ site_name: siteName, email_template: emailTemplate })} disabled={mutation.isPending}>
                Save Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
