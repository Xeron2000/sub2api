import { Link, useRouterState } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/i18n"
import { isAdmin, getIsSimpleMode } from "@/lib/auth"

const RESTRICTED_SIMPLE_MODE_PATHS = new Set(["/admin/groups", "/admin/subscriptions", "/admin/redeem"])
const PAYMENT_PATHS = new Set(["/admin/orders/dashboard", "/admin/orders", "/admin/orders/plans"])
const RISK_PATHS = new Set(["/admin/risk-control", "/admin/prompt-audit"])
const OPS_PATHS = new Set(["/admin/ops"])

function isFlagEnabled(key: string): boolean | null {
  if (typeof window === "undefined") return null
  try {
    const v = localStorage.getItem(key)
    if (v === "true") return true
    if (v === "false") return false
    return null
  } catch {
    return null
  }
}

type NavItem = { to: string; labelKey: string; icon?: string }

const publicNav: NavItem[] = [
  { to: "/home", labelKey: "nav.dashboard" },
  { to: "/model-plaza", labelKey: "nav.modelPlaza" },
]

const userNav: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard" },
  { to: "/keys", labelKey: "nav.apiKeys" },
  { to: "/batch-image", labelKey: "nav.batchImage" },
  { to: "/usage", labelKey: "nav.usage" },
  { to: "/available-channels", labelKey: "nav.availableChannels" },
  { to: "/monitor", labelKey: "nav.channelStatus" },
  { to: "/subscriptions", labelKey: "nav.mySubscriptions" },
  { to: "/purchase", labelKey: "nav.buySubscription" },
  { to: "/orders", labelKey: "nav.myOrders" },
  { to: "/redeem", labelKey: "nav.redeem" },
  { to: "/affiliate", labelKey: "nav.affiliate" },
  { to: "/profile", labelKey: "nav.profile" },
]

const adminNav: NavItem[] = [
  { to: "/admin/dashboard", labelKey: "admin.dashboard.title" },
  { to: "/admin/users", labelKey: "admin.users.title" },
  { to: "/admin/groups", labelKey: "admin.groups.title" },
  { to: "/admin/accounts", labelKey: "admin.accounts.title" },
  { to: "/admin/proxies", labelKey: "admin.proxies.title" },
  { to: "/admin/channels/pricing", labelKey: "admin.channels.title" },
  { to: "/admin/channels/monitor", labelKey: "admin.channelMonitor.title" },
  { to: "/admin/subscriptions", labelKey: "admin.subscriptions.title" },
  { to: "/admin/announcements", labelKey: "admin.announcements.title" },
  { to: "/admin/redeem", labelKey: "admin.redeem.title" },
  { to: "/admin/promo-codes", labelKey: "admin.promo.title" },
  { to: "/admin/usage", labelKey: "admin.usage.title" },
  { to: "/admin/audit-logs", labelKey: "admin.audit.title" },
  { to: "/admin/affiliates/invites", labelKey: "nav.affiliateInviteRecords" },
  { to: "/admin/orders/dashboard", labelKey: "nav.paymentDashboard" },
  { to: "/admin/orders", labelKey: "nav.orderManagement" },
  { to: "/admin/orders/plans", labelKey: "nav.paymentPlans" },
  { to: "/admin/risk-control", labelKey: "admin.riskControl.title" },
  { to: "/admin/prompt-audit", labelKey: "admin.promptAudit.title" },
  { to: "/admin/ops", labelKey: "admin.ops.title" },
  { to: "/admin/settings", labelKey: "nav.settings" },
]

function NavGroup({ titleKey, items }: { titleKey: string; items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(titleKey)}</p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/")
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function AppSidebar() {
  const showAdmin = typeof window !== "undefined" ? isAdmin() : false
  const simpleMode = typeof window !== "undefined" ? getIsSimpleMode() : false
  const paymentEnabled = isFlagEnabled("payment_enabled_cached")
  const riskEnabled = isFlagEnabled("risk_control_enabled_cached")
  const opsEnabled = isFlagEnabled("ops_monitoring_enabled_cached")

  let filteredAdminNav = adminNav
  if (simpleMode) filteredAdminNav = filteredAdminNav.filter((i) => !RESTRICTED_SIMPLE_MODE_PATHS.has(i.to))
  if (paymentEnabled === false) filteredAdminNav = filteredAdminNav.filter((i) => !PAYMENT_PATHS.has(i.to))
  if (riskEnabled === false) filteredAdminNav = filteredAdminNav.filter((i) => !RISK_PATHS.has(i.to))
  if (opsEnabled === false) filteredAdminNav = filteredAdminNav.filter((i) => !OPS_PATHS.has(i.to))

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar p-4 gap-6 overflow-y-auto">
      <Link to="/home" className="px-2 text-base font-semibold tracking-tight">
        Sub2API
      </Link>
      <NavGroup titleKey="nav.public" items={publicNav} />
      <Separator />
      <NavGroup titleKey="nav.user" items={userNav} />
      {showAdmin ? (
        <>
          <Separator />
          <NavGroup titleKey="nav.admin" items={filteredAdminNav} />
        </>
      ) : null}
    </aside>
  )
}
