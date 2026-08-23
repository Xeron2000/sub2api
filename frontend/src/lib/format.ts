export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function formatRelative(value: string | Date) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const diff = new Date(value).getTime() - Date.now()
  const days = Math.round(diff / 86400000)
  if (Math.abs(days) < 1) return "today"
  return rtf.format(days, "day")
}
