import { Link, useRouterState } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/i18n"

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
  { to: "/admin/usage", labelKey: "admin.usage.title" },
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
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar p-4 gap-6 overflow-y-auto">
      <Link to="/home" className="px-2 text-base font-semibold tracking-tight">
        Sub2API
      </Link>
      <NavGroup titleKey="nav.public" items={publicNav} />
      <Separator />
      <NavGroup titleKey="nav.user" items={userNav} />
      <Separator />
      <NavGroup titleKey="nav.admin" items={adminNav} />
    </aside>
  )
}
