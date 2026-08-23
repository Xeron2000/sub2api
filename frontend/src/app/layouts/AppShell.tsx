import { AppSidebar } from "./AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { getLocale, setLocale } from "@/i18n"
import { useState } from "react"
import { Sun, Moon, LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [locale, setLocaleState] = useState(getLocale())
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(localStorage.getItem("auth_user") ?? "null") as { email?: string; role?: string } | null } catch { return null } })()
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const toggleLocale = () => {
    const next = locale === "en" ? "zh" : "en"
    setLocale(next as "en" | "zh")
    setLocaleState(next as "en" | "zh")
  }
  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard">Sub2API</BreadcrumbLink></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-8 w-8">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLocale} aria-label="Toggle language" className="h-8">
              {locale === "en" ? "中文" : "EN"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <User className="size-4" /> {user?.email ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>Change Password</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="size-4" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
