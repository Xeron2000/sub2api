import * as React from "react"

type Theme = "light" | "dark" | "system"
const STORAGE_KEY = "sub2api_theme"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const resolved = theme === "system" ? getSystemTheme() : theme
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" }
const ThemeCtx = React.createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system"
  })

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch {}
    applyTheme(t)
  }, [])

  React.useEffect(() => { applyTheme(theme) }, [theme])

  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const resolved: "light" | "dark" = theme === "system" ? getSystemTheme() : theme
  const value = React.useMemo(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx)
  if (!ctx) throw new Error("useTheme must be within ThemeProvider")
  return ctx
}
