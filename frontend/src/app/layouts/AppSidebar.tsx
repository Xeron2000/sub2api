import { LayoutDashboard, Users, Layers, ShieldAlert, Settings, CreditCard, Megaphone, Activity, Server } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useLocation, Link } from "react-router-dom"

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Ops", url: "/admin/ops", icon: Activity, admin: true },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { title: "Users", url: "/admin/users", icon: Users, admin: true },
      { title: "Groups", url: "/admin/groups", icon: Layers, admin: true },
    ],
  },
  {
    label: "Channels",
    items: [
      { title: "Channels", url: "/admin/channels/pricing", icon: Server, admin: true },
      { title: "Channel Monitor", url: "/admin/channels/monitor", icon: Activity, admin: true },
      { title: "Accounts", url: "/admin/accounts", icon: Server, admin: true },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Subscriptions", url: "/subscriptions", icon: CreditCard },
      { title: "Usage", url: "/usage", icon: Activity },
      { title: "API Keys", url: "/keys", icon: Server },
    ],
  },
  {
    label: "Security",
    items: [
      { title: "Audit Logs", url: "/admin/audit-logs", icon: ShieldAlert, admin: true },
      { title: "Risk Control", url: "/admin/risk-control", icon: ShieldAlert, admin: true },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings, admin: true },
      { title: "Announcements", url: "/admin/announcements", icon: Megaphone, admin: true },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-sm text-xs font-bold">S2</div>
          <span className="font-heading text-sm font-semibold">Sub2API</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground px-2 py-2 text-xs">Professional AI Infrastructure Console</div>
      </SidebarFooter>
    </Sidebar>
  )
}
