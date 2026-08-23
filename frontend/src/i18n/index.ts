type Locale = "en" | "zh"
const LOCALE_KEY = "sub2api_locale"

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "dashboard.title": "Dashboard",
    "dashboard.welcomeMessage": "Welcome back",
    "admin.users.title": "User Management",
    "admin.users.description": "Manage users, access and account status",
    "admin.channels.title": "Channel Management",
    "admin.channels.description": "Manage channels and pricing",
    "nav.dashboard": "Dashboard",
    "common.loading": "Loading...",
    "common.retry": "Retry",
  },
  zh: {
    "dashboard.title": "仪表盘",
    "dashboard.welcomeMessage": "欢迎回来",
    "admin.users.title": "用户管理",
    "admin.users.description": "管理用户、访问与账户状态",
    "admin.channels.title": "渠道管理",
    "admin.channels.description": "管理渠道与定价",
    "nav.dashboard": "仪表盘",
    "common.loading": "加载中...",
    "common.retry": "重试",
  },
}

let current: Locale = (localStorage.getItem(LOCALE_KEY) as Locale) || (navigator.language.startsWith("zh") ? "zh" : "en")

export function getLocale(): Locale { return current }
export function setLocale(l: Locale) { current = l; localStorage.setItem(LOCALE_KEY, l); document.documentElement.lang = l }
export function t(key: string): string { return messages[current][key] ?? key }
