import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { Protected } from "../Protected"

function renderProtected(path: string, admin = false, initialAuth: { token?: string; user?: unknown } = {}) {
  window.localStorage.clear()
  if (initialAuth.token) window.localStorage.setItem("auth_token", initialAuth.token)
  if (initialAuth.user) window.localStorage.setItem("auth_user", JSON.stringify(initialAuth.user))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route
          path="/protected"
          element={
            <Protected admin={admin}>
              <div>Secret</div>
            </Protected>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("Protected guard", () => {
  beforeEach(() => window.localStorage.clear())

  it("redirects unauthenticated to /login", () => {
    renderProtected("/protected")
    expect(screen.getByText("Login Page")).toBeInTheDocument()
  })

  it("allows authenticated user", () => {
    renderProtected("/protected", false, { token: "tok", user: { role: "user" } })
    expect(screen.getByText("Secret")).toBeInTheDocument()
  })

  it("redirects non-admin from admin route to /dashboard", () => {
    renderProtected("/protected", true, { token: "tok", user: { role: "user" } })
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument()
  })

  it("allows admin on admin route", () => {
    renderProtected("/protected", true, { token: "tok", user: { role: "admin" } })
    expect(screen.getByText("Secret")).toBeInTheDocument()
  })

  it("redirects invalid JSON user to /dashboard", () => {
    window.localStorage.setItem("auth_token", "tok")
    window.localStorage.setItem("auth_user", "{invalid")
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/protected" element={<Protected admin><div>Secret</div></Protected>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument()
  })
})
