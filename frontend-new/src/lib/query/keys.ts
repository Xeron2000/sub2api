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
    progress: () => ["subscriptions", "progress"] as const,
  },
  channels: {
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
} as const
