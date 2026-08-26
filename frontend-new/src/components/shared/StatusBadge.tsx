import { Badge } from "@/components/ui/badge"

type Status = "success" | "warning" | "error" | "info" | "default"

const variantMap: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  warning: "secondary",
  error: "destructive",
  info: "secondary",
  default: "outline",
}

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return <Badge variant={variantMap[status]}>{label ?? status}</Badge>
}
