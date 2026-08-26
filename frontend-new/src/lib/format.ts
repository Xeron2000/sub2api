export function formatMoney(value: number | null | undefined, fractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) return "-"
  return `$${value.toFixed(fractionDigits)}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-"
  return new Intl.NumberFormat().format(value)
}

export function formatTokens(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-"
  return formatNumber(value)
}

export function formatDateTime(value: string | number | null | undefined): string {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

export function formatPercentage(value: number | null | undefined, fractionDigits = 1): string {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(fractionDigits)}%`
}
