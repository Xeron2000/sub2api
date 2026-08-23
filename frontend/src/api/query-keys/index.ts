export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  detail: (id: string | number) => [...userKeys.all, "detail", id] as const,
}

export const channelKeys = {
  all: ["channels"] as const,
  lists: () => [...channelKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...channelKeys.lists(), filters] as const,
  detail: (id: string | number) => [...channelKeys.all, "detail", id] as const,
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
}

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (f: Record<string, unknown>) => [...groupKeys.lists(), f] as const,
}
