import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/i18n"
import { adminComplianceAPI } from "@/lib/api/admin/compliance"
import { toast } from "@/lib/toast"

const FALLBACK_ZH = "我已阅读、理解并同意 Sub2API 部署与运营合规承诺"
const FALLBACK_EN = "I have read, understood, and agree to the Sub2API Deployment and Operation Compliance Commitment"

export function AdminComplianceDialog() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState("")
  const [typed, setTyped] = useState("")
  const [version, setVersion] = useState("v2026.06.10")
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const expected = phrase || (locale === "zh" ? FALLBACK_ZH : FALLBACK_EN)

  const fetchStatus = useCallback(async () => {
    try {
      const s = await adminComplianceAPI.getStatus()
      if (s.required) {
        setVersion(s.version || version)
        if (locale === "zh") setPhrase(s.ack_phrase_zh || FALLBACK_ZH)
        else setPhrase(s.ack_phrase_en || FALLBACK_EN)
        // only show if authenticated admin - checked via event or initial fetch
        // we show here if required and user is admin (isAdmin check inside effect caller)
        setOpen(true)
      }
    } catch {
      // ignore 401/403 etc - not admin
    }
  }, [locale, version])

  useEffect(() => {
    // initial check for admin users on /admin
    if (typeof window === "undefined") return
    if (!window.location.pathname.startsWith("/admin")) return
    // defer to avoid flash before auth load
    const timer = setTimeout(() => {
      import("@/lib/auth").then(({ getAuthStatus, isAdmin }) => {
        if (getAuthStatus() === "authenticated" && isAdmin()) fetchStatus()
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [fetchStatus])

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<Record<string, unknown>>
      const meta = ce.detail as Record<string, unknown> | undefined
      if (meta) {
        if (typeof meta.version === "string") setVersion(meta.version)
        if (locale === "zh" && typeof meta.ack_phrase_zh === "string") setPhrase(meta.ack_phrase_zh)
        else if (typeof meta.ack_phrase_en === "string") setPhrase(meta.ack_phrase_en)
        else if (typeof meta.ack_phrase === "string") setPhrase(meta.ack_phrase as string)
      }
      setOpen(true)
      setTyped("")
      setAttempted(false)
    }
    window.addEventListener("admin-compliance-required", handler as EventListener)
    return () => window.removeEventListener("admin-compliance-required", handler as EventListener)
  }, [locale])

  useEffect(() => {
    setTyped("")
    setAttempted(false)
  }, [expected])

  const canSubmit = typed.trim() === expected
  const showError = attempted && !canSubmit

  async function onAccept() {
    setAttempted(true)
    if (!canSubmit) return
    setLoading(true)
    try {
      const next = await adminComplianceAPI.accept({ phrase: typed.trim(), language: locale })
      if (!next.required) {
        toast.success(t("adminCompliance.accepted") ?? "Compliance acknowledged")
        setOpen(false)
      } else {
        toast.error(t("adminCompliance.acceptFailed") ?? "Accept failed")
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message || (t("adminCompliance.acceptFailed") as string) || "Accept failed"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function onLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("auth_user")
      window.location.href = "/login"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) return /* block close */ }}>
      <DialogContent showCloseButton={false} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{(t("adminCompliance.title") as string) || "Admin Compliance Acknowledgement"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">{(t("adminCompliance.blockingNotice") as string) || "Action blocked — compliance acknowledgement required (HTTP 423)."}</p>
            <p className="mt-2 leading-6">{(t("adminCompliance.riskNotice") as string) || "Please read the compliance document and type the exact phrase to continue."}</p>
            <p className="mt-2 text-xs">Version: <span className="font-mono">{version}</span></p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="compliance-phrase">{(t("adminCompliance.inputLabel") as string) || "Type the phrase exactly:"}</Label>
            <div className="rounded-none bg-muted px-3 py-2 font-mono text-sm">{expected}</div>
            <Input
              id="compliance-phrase"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={(t("adminCompliance.inputPlaceholder") as string) || "Type the phrase above"}
              autoComplete="off"
              disabled={loading}
              aria-invalid={showError}
              onKeyDown={(e) => { if (e.key === "Enter") onAccept() }}
            />
            {showError ? <p className="text-sm text-destructive">{(t("adminCompliance.inputMismatch") as string) || "Phrase does not match"}</p> : null}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">{(t("adminCompliance.legalNote") as string) || "By acknowledging you confirm you have read and understood the compliance document."}</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onLogout} disabled={loading}>{(t("adminCompliance.logout") as string) || "Logout"}</Button>
          <Button type="button" onClick={onAccept} disabled={!canSubmit || loading} aria-busy={loading}>{loading ? (t("common.submitting") as string) || "Submitting..." : (t("adminCompliance.accept") as string) || "Acknowledge & Continue"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
