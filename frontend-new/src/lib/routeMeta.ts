export type RouteMeta = {
  titleKey: string
  descriptionKey?: string
}

export const routeMeta: Record<string, RouteMeta> = {
  "/": { titleKey: "landing.heroSubtitle", descriptionKey: "landing.heroDescription" },
  "/home": { titleKey: "home.title", descriptionKey: "home.description" },
  "/login": { titleKey: "home.login", descriptionKey: "auth.loginDescription" },
  "/register": { titleKey: "auth.createAccount", descriptionKey: "auth.createAccountDesc" },
  "/dashboard": { titleKey: "dashboard.title", descriptionKey: "dashboard.welcomeMessage" },
  "/keys": { titleKey: "keys.title", descriptionKey: "keys.description" },
  "/usage": { titleKey: "usage.title", descriptionKey: "usage.description" },
  "/key-usage": { titleKey: "usage.title", descriptionKey: "usage.description" },
  "/model-plaza": { titleKey: "modelPlaza.title", descriptionKey: "modelPlaza.description" },
  "/available-channels": { titleKey: "nav.availableChannels", descriptionKey: "nav.availableChannelsDesc" },
  "/monitor": { titleKey: "nav.channelStatus" },
  "/batch-image": { titleKey: "batchImageGuide.title", descriptionKey: "batchImageGuide.description" },
  "/subscriptions": { titleKey: "userSubscriptions.title" },
  "/profile": { titleKey: "profile.title" },
  "/affiliate": { titleKey: "affiliate.title" },
  "/purchase": { titleKey: "purchase.title" },
  "/orders": { titleKey: "nav.myOrders" },
  "/redeem": { titleKey: "redeem.title" },
  "/custom/$id": { titleKey: "customPage.title" },
  "/admin/dashboard": { titleKey: "admin.dashboard.title" },
  "/admin/users": { titleKey: "admin.users.title" },
  "/admin/groups": { titleKey: "admin.groups.title" },
  "/admin/accounts": { titleKey: "admin.accounts.title" },
  "/admin/channels/monitor": { titleKey: "admin.channelMonitor.title" },
  "/admin/channels/pricing": { titleKey: "admin.channels.title" },
  "/admin/announcements": { titleKey: "admin.announcements.title" },
  "/admin/proxies": { titleKey: "admin.proxies.title" },
  "/admin/redeem": { titleKey: "admin.redeem.title" },
  "/admin/promo-codes": { titleKey: "admin.promo.title" },
  "/admin/settings": { titleKey: "admin.settings.title" },
  "/admin/ops": { titleKey: "admin.ops.title" },
  "/admin/audit-logs": { titleKey: "admin.audit.title" },
  "/admin/usage": { titleKey: "admin.usage.title" },
  "/admin/risk-control": { titleKey: "admin.riskControl.title" },
  "/admin/prompt-audit": { titleKey: "admin.promptAudit.title" },
  "/admin/subscriptions": { titleKey: "admin.subscriptions.title" },
  "/admin/orders": { titleKey: "admin.orderManagement" },
  "/admin/orders/plans": { titleKey: "admin.paymentPlans" },
  "/admin/orders/dashboard": { titleKey: "admin.paymentDashboard" },
  "/admin/affiliates/invites": { titleKey: "nav.affiliateInviteRecords" },
  "/admin/affiliates/rebates": { titleKey: "nav.affiliateRebateRecords" },
  "/admin/affiliates/transfers": { titleKey: "nav.affiliateTransferRecords" },
}

export function getRouteMeta(path: string): RouteMeta | undefined {
  if (routeMeta[path]) return routeMeta[path]
  // handle dynamic routes like /legal/$documentId, /admin/users etc. fallback
  for (const [key, meta] of Object.entries(routeMeta)) {
    if (key.includes("$") && path.startsWith(key.split("/$")[0])) return meta
  }
  return undefined
}
