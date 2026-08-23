import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { LoadingState, ErrorState } from "@/components/shared/EmptyState"

export function PurchasePage() {
  const [plan, setPlan] = useState("basic")
  const [method, setMethod] = useState("wechat")
  const plansQ = useQuery({ queryKey: ["purchase-plans"], queryFn: async () => (await httpClient.get("/subscriptions")).data, retry: false })
  const mut = useMutation({
    mutationFn: async () => {
      const res = await httpClient.post("/payment/create", { plan, pay_method: method })
      return res.data as { order_id: string; pay_url?: string; qr_code?: string }
    },
    onSuccess: (d) => {
      if (d.pay_url) window.open(d.pay_url, "_blank")
      else if (d.qr_code) window.location.href = `/payment/qrcode?order_id=${d.order_id}`
      else if (d.order_id) window.location.href = `/payment/qrcode?order_id=${d.order_id}`
      else toast.info(JSON.stringify(d))
    },
    onError: (e) => toast.error((e as Error).message),
  })
  if (plansQ.isLoading) return <LoadingState />
  if (plansQ.error) return <ErrorState message={(plansQ.error as Error).message} onRetry={() => plansQ.refetch()} />
  return (
    <Page>
      <PageHeader title="Purchase Subscription" description="Choose plan and payment channel — POST /payment/create." />
      <Section>
        <Card className="rounded-none"><CardHeader><CardTitle>Select Plan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground"><pre className="bg-muted p-2 overflow-auto max-h-32">{JSON.stringify(plansQ.data ?? {}, null, 2)}</pre></div>
            <RadioGroup value={plan} onValueChange={setPlan} className="flex gap-4">
              <div className="flex items-center gap-1"><RadioGroupItem value="basic" id="basic" /><Label htmlFor="basic">Basic</Label></div>
              <div className="flex items-center gap-1"><RadioGroupItem value="pro" id="pro" /><Label htmlFor="pro">Pro</Label></div>
              <div className="flex items-center gap-1"><RadioGroupItem value="enterprise" id="enterprise" /><Label htmlFor="enterprise">Enterprise</Label></div>
            </RadioGroup>
            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="flex gap-4 mt-1">
                <div className="flex items-center gap-1"><RadioGroupItem value="wechat" id="wechat" /><Label htmlFor="wechat">WeChat</Label></div>
                <div className="flex items-center gap-1"><RadioGroupItem value="alipay" id="alipay" /><Label htmlFor="alipay">Alipay</Label></div>
                <div className="flex items-center gap-1"><RadioGroupItem value="stripe" id="stripe" /><Label htmlFor="stripe">Stripe</Label></div>
                <div className="flex items-center gap-1"><RadioGroupItem value="airwallex" id="airwallex" /><Label htmlFor="airwallex">Airwallex</Label></div>
              </RadioGroup>
            </div>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Creating order..." : "Purchase"}</Button>
          </CardContent>
        </Card>
      </Section>
    </Page>
  )
}
