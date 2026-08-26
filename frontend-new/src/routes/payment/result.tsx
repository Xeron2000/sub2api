import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/components/shared/PageContainer"
import { PublicShell } from "@/components/layout/AppShell"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { paymentAPI } from "@/lib/api/payment"
import { normalizeOrderStatus  } from "@/lib/payment/polling"
import type {OrderStatus} from "@/lib/payment/polling";

export const Route = createFileRoute("/payment/result")({ component: PaymentResultPage })

function PaymentResultPage() {
  const rawOrderId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("order_id") ?? new URLSearchParams(window.location.search).get("out_trade_no") ?? "" : ""
  // Never trust ?status=success — authoritative is backend order (§48)
  const query = useQuery({
    queryKey: ["payment", "result", rawOrderId],
    queryFn: async () => {
      if (!rawOrderId) return { status: "unknown" as OrderStatus, message: "No order identifier" }
      try {
        const { data } = await paymentAPI.verifyOrder(rawOrderId).catch(() => paymentAPI.verifyOrderPublic(rawOrderId))
        const d = data as { status?: unknown; message?: string; data?: { status?: unknown } }
        const rawStatus = d?.status ?? d?.data?.status ?? "unknown"
        const status = normalizeOrderStatus(rawStatus)
        return { status, message: d?.message ?? String(rawStatus), raw: d }
      } catch (e) {
        const msg = (e as { message?: string })?.message ?? "Failed to verify"
        return { status: "unknown" as OrderStatus, message: msg }
      }
    },
    enabled: typeof window !== "undefined" && rawOrderId !== "",
    retry: false,
  })

  const statusLabel: Record<OrderStatus, string> = {
    creating: "Creating",
    waiting: "Pending",
    paid: "Paid — confirmed by backend",
    expired: "Expired",
    failed: "Failed",
    canceled: "Canceled",
    refunded: "Refunded",
    unknown: "Unknown",
  }

  return (
    <PublicShell>
      <PageContainer>
        <h1 className="text-2xl font-semibold">Payment Result</h1>
        {!rawOrderId ? (
          <ErrorState message="Missing order identifier" onRetry={() => (window.location.href = "/orders")} />
        ) : query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState message={(query.error as { message?: string })?.message ?? "Failed to load"} onRetry={() => query.refetch()} />
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium" data-testid="order-status">{statusLabel[query.data!.status]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{query.data!.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">Order: {rawOrderId}</p>
              {(query.data!.status === "failed" || query.data!.status === "expired") && (
                <Link to="/purchase" className="mt-3 inline-block text-sm text-primary hover:underline">Try again / Orders</Link>
              )}
              {query.data!.status === "paid" && <Link to="/orders" className="mt-3 inline-block text-sm text-primary hover:underline">View orders</Link>}
            </div>
            {query.data!.status === "unknown" && <p className="text-xs text-muted-foreground">Unknown status shown as safe fallback (§39)</p>}
          </div>
        )}
      </PageContainer>
    </PublicShell>
  )
}
