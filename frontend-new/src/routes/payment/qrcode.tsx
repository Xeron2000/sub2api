import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { PageContainer } from "@/components/shared/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { paymentAPI } from "@/lib/api/payment"

export const Route = createFileRoute("/payment/qrcode")({ component: QRCodePage })

function QRCodePage() {
  const query = useQuery({
    queryKey: ["payment", "qrcode"],
    queryFn: async () => {
      const { data } = await paymentAPI.getCheckoutInfo()
      const d = data as unknown as { qrcode_url?: string; url?: string }
      return { url: d.qrcode_url ?? d.url ?? "" }
    },
  })

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-base">Scan to Pay</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {query.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading QR...</p>
            ) : query.data?.url ? (
              <img src={query.data.url} alt="QR Code" className="h-64 w-64 border rounded" />
            ) : (
              <p className="text-sm text-muted-foreground">No QR code</p>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  )
}
