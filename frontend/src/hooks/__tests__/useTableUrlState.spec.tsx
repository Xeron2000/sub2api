import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { useTableUrlState } from "../useTableUrlState"

function Harness() {
  const { search, pagination, sorting, setSearch, setPagination, setSorting } = useTableUrlState({ pageSize: 10 })
  return (
    <div>
      <div data-testid="search">{search}</div>
      <div data-testid="page">{String(pagination.pageIndex + 1)}</div>
      <div data-testid="sort">{sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : "none"}</div>
      <button onClick={() => setSearch("alice")}>setSearch</button>
      <button onClick={() => setPagination({ pageIndex: 2, pageSize: 20 })}>setPage</button>
      <button onClick={() => setSorting([{ id: "email", desc: true }])}>setSort</button>
    </div>
  )
}

describe("useTableUrlState", () => {
  it("hydrates from URL and hydrates", () => {
    render(
      <MemoryRouter initialEntries={["/test?page=2&pageSize=20&search=bob&sort=email.desc"]}>
        <Routes><Route path="/test" element={<Harness />} /></Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId("search").textContent).toBe("bob")
    expect(screen.getByTestId("page").textContent).toBe("2")
    expect(screen.getByTestId("sort").textContent).toBe("email.desc")
  })

  it("updates URL on setSearch", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes><Route path="/test" element={<Harness />} /></Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("setSearch"))
    expect(screen.getByTestId("search").textContent).toBe("alice")
  })
})
