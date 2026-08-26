import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./EmptyState"
import { ErrorState } from "./ErrorState"
import { useTranslation } from "@/i18n"

export type DataTableColumn = { header: string; accessorKey?: string; cell?: (row: any) => ReactNode; align?: "left" | "right" }

export function DataTable({
  columns,
  data,
  loading,
  error,
  emptyTitle,
  emptyTitleKey,
  emptyAction,
  onRetry,
  getRowId,
}: {
  columns: DataTableColumn[]
  data: any[]
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyTitleKey?: string
  emptyAction?: ReactNode
  onRetry?: () => void
  getRowId?: (row: any, index: number) => string | number
}) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="space-y-2" aria-busy>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (data.length === 0) {
    if (emptyTitleKey) return <EmptyState titleKey={emptyTitleKey} action={emptyAction} />
    return <EmptyState title={emptyTitle ?? t("common.noData")} action={emptyAction} />
  }

  return (
    <div className="rounded-md border overflow-x-auto">
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
          {data.map((row, ri) => {
            const maybeId = (row as Record<string, unknown>)?.id as string | number | undefined
            const rowId = getRowId ? getRowId(row, ri) : (maybeId ?? ri)
            return (
              <TableRow key={String(rowId)} className="hover:bg-muted/50">
                {columns.map((col, ci) => (
                  <TableCell key={ci} className={col.align === "right" ? "text-right" : "text-left"}>
                    {col.cell ? col.cell(row) : col.accessorKey ? String((row as Record<string, unknown>)[col.accessorKey] ?? "") : null}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
