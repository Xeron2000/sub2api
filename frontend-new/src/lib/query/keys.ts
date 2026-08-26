export const queryKeys = {
  auth: {
    currentUser: () => ["auth", "currentUser"] as const,
  },
  users: {
    all: () => ["users"] as const,
    list: (filters: Record<string, unknown> = {}) => ["users", "list", filters] as const,
    detail: (id: number | string) => ["users", "detail", id] as const,
  },
  keys: {
    all: () => ["keys"] as const,
    list: (filters: Record<string, unknown> = {}) => ["keys", "list", filters] as const,
    detail: (id: number | string) => ["keys", "detail", id] as const,
  },
  usage: {
    all: () => ["usage"] as const,
    list: (filters: Record<string, unknown> = {}) => ["usage", "list", filters] as const,
    stats: () => ["usage", "stats"] as const,
    dashboard: () => ["usage", "dashboard"] as const,
  },
  subscriptions: {
    all: () => ["subscriptions"] as const,
    list: () => ["subscriptions", "list"] as const,
    active: () => ["subscriptions", "active"] as const,
    progress: () => ["subscriptions", "progress"] as const,
    summary: () => ["subscriptions", "summary"] as const,
  },
  channels: {
    all: () => ["channels"] as const,
    available: () => ["channels", "available"] as const,
  },
  announcements: {
    list: () => ["announcements", "list"] as const,
  },
  batchImage: {
    all: () => ["batchImage"] as const,
    list: (filters: Record<string, unknown> = {}) => ["batchImage", "list", filters] as const,
    detail: (id: string) => ["batchImage", "detail", id] as const,
  },
  redeem: {
    all: () => ["redeem"] as const,
    history: () => ["redeem", "history"] as const,
  },
  affiliate: {
    all: () => ["affiliate"] as const,
    detail: () => ["affiliate", "detail"] as const,
    invitees: () => ["affiliate", "invitees"] as const,
  },
  profile: {
    all: () => ["profile"] as const,
    detail: () => ["profile", "detail"] as const,
  },
  monitor: {
    all: () => ["monitor"] as const,
    status: (filters: Record<string, unknown> = {}) => ["monitor", "status", filters] as const,
    snapshot: (filters: Record<string, unknown> = {}) => ["monitor", "snapshot", filters] as const,
    matrix: (filters: Record<string, unknown> = {}) => ["monitor", "matrix", filters] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    list: (filters: Record<string, unknown> = {}) => ["orders", "list", filters] as const,
  },
  purchase: {
    all: () => ["purchase"] as const,
    plans: () => ["purchase", "plans"] as const,
  },
  admin: {
    dashboard: {
      all: () => ["admin", "dashboard"] as const,
      stats: () => ["admin", "dashboard", "stats"] as const,
    },
    usage: {
      all: () => ["admin", "usage"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "usage", "list", filters] as const,
    },
    audit: {
      all: () => ["admin", "audit"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "audit", "list", filters] as const,
      detail: (id: number | string) => ["admin", "audit", "detail", id] as const,
    },
    announcements: {
      all: () => ["admin", "announcements"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "announcements", "list", filters] as const,
      detail: (id: number | string) => ["admin", "announcements", "detail", id] as const,
    },
    groups: {
      all: () => ["admin", "groups"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "groups", "list", filters] as const,
      detail: (id: number | string) => ["admin", "groups", "detail", id] as const,
    },
    accounts: {
      all: () => ["admin", "accounts"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "accounts", "list", filters] as const,
      detail: (id: number | string) => ["admin", "accounts", "detail", id] as const,
    },
    channels: {
      all: () => ["admin", "channels"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "channels", "list", filters] as const,
      pricing: (filters: Record<string, unknown> = {}) => ["admin", "channels", "pricing", filters] as const,
      monitor: (filters: Record<string, unknown> = {}) => ["admin", "channels", "monitor", filters] as const,
    },
    proxies: {
      all: () => ["admin", "proxies"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "proxies", "list", filters] as const,
      detail: (id: number | string) => ["admin", "proxies", "detail", id] as const,
    },
    redeem: {
      all: () => ["admin", "redeem"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "redeem", "list", filters] as const,
    },
    promo: {
      all: () => ["admin", "promo"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "promo", "list", filters] as const,
    },
    subscriptions: {
      all: () => ["admin", "subscriptions"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "subscriptions", "list", filters] as const,
      detail: (id: number | string) => ["admin", "subscriptions", "detail", id] as const,
    },
    orders: {
      all: () => ["admin", "orders"] as const,
      dashboard: () => ["admin", "orders", "dashboard"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "orders", "list", filters] as const,
      plans: () => ["admin", "orders", "plans"] as const,
    },
    affiliates: {
      all: () => ["admin", "affiliates"] as const,
      invites: (filters: Record<string, unknown> = {}) => ["admin", "affiliates", "invites", filters] as const,
      rebates: (filters: Record<string, unknown> = {}) => ["admin", "affiliates", "rebates", filters] as const,
      transfers: (filters: Record<string, unknown> = {}) => ["admin", "affiliates", "transfers", filters] as const,
    },
    settings: {
      all: () => ["admin", "settings"] as const,
      detail: () => ["admin", "settings", "detail"] as const,
    },
    risk: {
      all: () => ["admin", "risk"] as const,
      config: () => ["admin", "risk", "config"] as const,
    },
    promptAudit: {
      all: () => ["admin", "prompt-audit"] as const,
      list: (filters: Record<string, unknown> = {}) => ["admin", "prompt-audit", "list", filters] as const,
    },
    ops: {
      all: () => ["admin", "ops"] as const,
      overview: () => ["admin", "ops", "overview"] as const,
    },
  },
} as const
