import { useQuery, useMutation } from "@tanstack/react-query"
import { httpClient } from "@/api/client/http-client"
import { Page, PageHeader, Section } from "@/components/shared/Page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export function AffiliatePage() {
  const { data, refetch } = useQuery({ queryKey: ["aff"], queryFn: async () => (await httpClient.get("/user/aff")).data as { balance: number; invited: number; code: string } })
  const [amount, setAmount] = useState("")
  const mut = useMutation({
    mutationFn: async () => (await httpClient.post("/user/aff/transfer", { amount: Number(amount) })).data,
    onSuccess: () => { alert("Transferred"); refetch(); setAmount("") },
    onError: (e) => alert((e as Error).message),
  })
  return (
    <Page>
      <PageHeader title="Affiliate" description="Rebates and transfers — GET /user/aff and POST /user/aff/transfer." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Balance</CardTitle></CardHeader><CardContent className="text-2xl">{(data as { balance?: number })?.balance ?? 0}</CardContent></Card>
        <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Invited</CardTitle></CardHeader><CardContent className="text-2xl">{(data as { invited?: number })?.invited ?? 0}</CardContent></Card>
        <Card className="rounded-none"><CardHeader><CardTitle className="text-sm">Invite Code</CardTitle></CardHeader><CardContent className="font-mono text-sm">{(data as { code?: string })?.code ?? "—"}</CardContent></Card>
      </div>
      <Section title="Transfer to Balance">
        <Card className="rounded-none max-w-md"><CardContent className="p-4 space-y-3">
          <div className="space-y-1"><Label>Amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" /></div>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !amount}>{mut.isPending ? "Transferring..." : "Transfer"}</Button>
        </CardContent></Card>
      </Section>
    </Page>
  )
}
