import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./EmptyState"
import { ErrorState } from "./ErrorState"
import { useTranslation } from "@/i18n"

type Column = { header: string; accessorKey?: string; cell?: (row: any) => ReactNode; align?: "left" | "right" }

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  emptyTitle,
  emptyTitleKey,
  emptyAction,
  onRetry,
}: {
  columns: Column[]
  data: T[]
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyTitleKey?: string
  emptyAction?: ReactNode
  onRetry?: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  const { t } = useTranslation()
  if (data.length === 0) {
    if (emptyTitleKey) return <EmptyState titleKey={emptyTitleKey} action={emptyAction} />
    return <EmptyState title={emptyTitle ?? t("common.noData")} action={emptyAction} />
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.align === "right" ? "text-right" : "text-left"}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, ri) => (
            <TableRow key={ri} className="hover:bg-muted/50">
              {columns.map((col, ci) => (
                <TableCell key={ci} className={col.align === "right" ? "text-right" : "text-left"}>
                  {col.cell ? col.cell(row) : (row[col.accessorKey as string] as ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
