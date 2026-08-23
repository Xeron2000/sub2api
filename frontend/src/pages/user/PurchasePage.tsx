import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { httpClient } from "@/api/client/http-client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PurchasePage() {
  const [plan, setPlan] = useState("basic")
  const buy = async () => { await httpClient.post("/payment/create", { plan }) }
  return (
    <Page>
      <PageHeader title="Purchase Subscription" description="Choose a plan and pay." />
      <Section>
        <Card className="rounded-none"><CardHeader><CardTitle>Plans</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="space-y-1"><Label>Plan</Label><Input value={plan} onChange={(e) => setPlan(e.target.value)} /></div>
          <Button onClick={buy}>Purchase</Button>
        </CardContent></Card>
      </Section>
    </Page>
  )
}
