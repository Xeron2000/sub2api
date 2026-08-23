import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "success" | "warning" | "error" | "info" | "neutral" | "active" | "inactive" | "pending"

const variantMap: Record<Status, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  neutral: "bg-muted text-muted-foreground",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
}

export function StatusBadge({ status, children }: { status: Status; children: React.ReactNode }) {
  return <Badge variant="outline" className={cn("rounded-none border text-xs font-medium", variantMap[status])}>{children}</Badge>
}
