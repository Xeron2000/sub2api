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
} as const
