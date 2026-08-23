import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "./EmptyState"

type Props<T> = {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyAction?: () => void
  pagination?: { pageIndex: number; pageSize: number }
  sorting?: SortingState
  onPaginationChange?: (updater: { pageIndex: number; pageSize: number } | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => void
  onSortingChange?: (updater: SortingState | ((old: SortingState) => SortingState)) => void
}

export function DataTable<T>({
  data,
  columns,
  loading,
  error,
  onRetry,
  emptyTitle = "No data",
  emptyDescription,
  emptyActionLabel,
  emptyAction,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
}: Props<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const sortingState = sorting ?? internalSorting
  const paginationState = pagination ?? internalPagination
  const handleSortingChange = onSortingChange ?? setInternalSorting
  const handlePaginationChange = onPaginationChange ?? setInternalPagination

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange as (updater: SortingState | ((old: SortingState) => SortingState)) => void,
    onPaginationChange: handlePaginationChange as (updater: { pageIndex: number; pageSize: number } | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => void,
    state: { sorting: sortingState, pagination: paginationState },
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} onAction={emptyAction} />

  return (
    <div className="space-y-3">
      <div className="rounded-none border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">Page {pagination.pageIndex + 1}</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={pagination.pageIndex === 0} onClick={() => handlePaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}>Prev</Button>
            <Button variant="outline" size="sm" disabled={data.length < pagination.pageSize} onClick={() => handlePaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
