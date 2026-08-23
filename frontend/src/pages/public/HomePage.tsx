import { useQuery } from "@tanstack/react-query"
import { getPublicSettings } from "@/api/public"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { t } from "@/i18n"

export function HomePage() {
  const { data } = useQuery({ queryKey: ["public", "settings"], queryFn: getPublicSettings })
  return (
    <Page>
      <PageHeader title={data?.site_name || "Sub2API"} description="AI API Gateway Platform — Subscription Quota Distribution" actions={<div className="flex gap-2"><Link to="/login"><Button>Sign in</Button></Link><Link to="/model-plaza"><Button variant="outline">Model Plaza</Button></Link></div>} />
      <Section title="Platform">
        <Card className="rounded-none"><CardContent className="p-6 text-sm">{t("dashboard.welcomeMessage")} — {data ? "loaded" : "loading public config..."}</CardContent></Card>
      </Section>
      <Section title="Quick links">
        <div className="flex flex-wrap gap-2">
          <Link to="/key-usage"><Button variant="outline">Key Usage</Button></Link>
          <Link to="/legal/privacy"><Button variant="outline">Legal</Button></Link>
        </div>
      </Section>
    </Page>
  )
}
