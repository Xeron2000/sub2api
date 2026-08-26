import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./AppSidebar"
import { useTranslation, availableLocales } from "@/i18n"
import { useTheme } from "@/lib/theme"
import { RiMenuLine, RiSunLine, RiMoonLine } from "@remixicon/react"

export function AppHeader() {
  const { t, locale, setLocale } = useTranslation()
  const { theme, setTheme, resolved } = useTheme()
  const nextLocale = locale === "en" ? "zh" : "en"
  const nextLabel = availableLocales.find((l) => l.code === nextLocale)?.name ?? nextLocale
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("common.toggleMenu")}><RiMenuLine size={18} aria-hidden /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>
        <Link to="/home" className="font-semibold md:hidden">
          Sub2API
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {resolved === "dark" ? <RiSunLine size={18} aria-hidden /> : <RiMoonLine size={18} aria-hidden />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(nextLocale)}
          aria-label="Toggle locale"
        >
          {locale === "en" ? "中文" : "EN"} · {nextLabel}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">{t("home.login")}</Link>
        </Button>
      </div>
    </header>
  )
}
