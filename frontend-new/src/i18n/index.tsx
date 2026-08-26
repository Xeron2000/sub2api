import * as React from "react"

import en from "./locales/en"
import zh from "./locales/zh"
import appEn from "./locales/en/app"
import appZh from "./locales/zh/app"

type Locale = "en" | "zh"
type Messages = Record<string, unknown>

const LOCALE_KEY = "sub2api_locale"
const DEFAULT_LOCALE: Locale = "en"

function deepMerge(target: Messages, source: Messages): Messages {
  const out: Messages = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Messages, v as Messages)
    } else {
      out[k] = v as unknown
    }
  }
  return out
}

const translations: Record<Locale, Messages> = {
  en: deepMerge(en as unknown as Messages, appEn as unknown as Messages),
  zh: deepMerge(zh as unknown as Messages, appZh as unknown as Messages),
}

function isLocale(v: string): v is Locale {
  return v === "en" || v === "zh"
}

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && isLocale(saved)) return saved
    const nav = navigator.language.toLowerCase()
    if (nav.startsWith("zh")) return "zh"
  }
  return DEFAULT_LOCALE
}

function getNested(messages: Messages, key: string): unknown {
  const parts = key.split(".")
  let cur: unknown = messages
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  let res = template
  for (const [k, v] of Object.entries(params)) {
    res = res.replaceAll(`{${k}}`, String(v))
  }
  return res
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const msgs = translations[locale] ?? translations[DEFAULT_LOCALE]
  const val = getNested(msgs, key)
  if (typeof val === "string") return interpolate(val, params)
  // fallback to en
  if (locale !== DEFAULT_LOCALE) {
    const fallback = getNested(translations[DEFAULT_LOCALE], key)
    if (typeof fallback === "string") return interpolate(fallback, params)
  }
  return key
}

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => getInitialLocale())

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_KEY, l)
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", l)
    }
  }, [])

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale)
    }
  }, [locale])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  )

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}

export function useLocale() {
  return useTranslation()
}

export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && isLocale(saved)) return saved
  }
  return DEFAULT_LOCALE
}

export const availableLocales = [
  { code: "en" as const, name: "English", flag: "🇺🇸" },
  { code: "zh" as const, name: "中文", flag: "🇨🇳" },
] as const

// Standalone t for non-React contexts (e.g., routeMeta)
export function tStandalone(key: string, params?: Record<string, string | number>): string {
  const loc = getLocale()
  return translate(loc, key, params)
}
