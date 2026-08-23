import { useSearchParams } from "react-router-dom"
import { useCallback, useMemo } from "react"
import type { SortingState, PaginationState } from "@tanstack/react-table"

type TableUrlState = {
  pagination: PaginationState
  sorting: SortingState
  search: string
  setPagination: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => void
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void
  setSearch: (value: string) => void
}

// pagination.pageIndex is 0-based, URL page is 1-based
export function useTableUrlState(defaults: { pageSize?: number } = {}): TableUrlState {
  const [params, setParams] = useSearchParams()

  const pagination = useMemo<PaginationState>(() => {
    const page = Math.max(1, Number(params.get("page") || "1")) - 1
    const pageSize = Math.max(1, Number(params.get("pageSize") || String(defaults.pageSize ?? 20)))
    return { pageIndex: page, pageSize }
  }, [params, defaults.pageSize])

  const sorting = useMemo<SortingState>(() => {
    const sort = params.get("sort")
    if (!sort) return []
    // format: field.direction e.g. created_at.desc
    const [id, dir] = sort.split(".")
    if (!id) return []
    return [{ id, desc: dir === "desc" }]
  }, [params])

  const search = params.get("search") ?? ""

  const setPagination = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const next = typeof updater === "function" ? (updater as (old: PaginationState) => PaginationState)(pagination) : updater
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        p.set("page", String(next.pageIndex + 1))
        p.set("pageSize", String(next.pageSize))
        return p
      })
    },
    [pagination, setParams]
  )

  const setSorting = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? (updater as (old: SortingState) => SortingState)(sorting) : updater
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        if (next.length === 0) {
          p.delete("sort")
        } else {
          const s = next[0]
          p.set("sort", `${s.id}.${s.desc ? "desc" : "asc"}`)
        }
        // reset to first page when sorting changes
        p.set("page", "1")
        return p
      })
    },
    [sorting, setParams]
  )

  const setSearch = useCallback(
    (value: string) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        if (value) p.set("search", value)
        else p.delete("search")
        p.set("page", "1")
        return p
      })
    },
    [setParams]
  )

  return { pagination, sorting, search, setPagination, setSorting, setSearch }
}
