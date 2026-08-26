import { createFileRoute, Link } from "@tanstack/react-router"
import { PublicShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n"

export const Route = createFileRoute("/home")({ component: HomePage })

function HomePage() {
  const { t } = useTranslation()
  return (
    <PublicShell>
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Sub2API</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{t("landing.heroDescription")}</p>
          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link to="/login">{t("home.getStarted")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{t("home.features.unifiedGateway")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("home.features.unifiedGatewayDesc")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{t("home.features.multiAccount")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("home.features.multiAccountDesc")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{t("home.features.balanceQuota")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("home.features.balanceQuotaDesc")}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PublicShell>
  )
}
