import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { queryClient } from "@/lib/query/client"
import { I18nProvider, getLocale } from "@/i18n"
import { ThemeProvider } from "@/lib/theme"
import { Toaster } from "@/components/ui/sonner"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Sub2API",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const initialLang = (() => {
    try { return getLocale() } catch { return "en" }
  })()
  return (
    <html lang={initialLang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>{children}</TooltipProvider>
            </QueryClientProvider>
          {import.meta.env.DEV ? (
            <TanStackDevtools
              config={{ position: "bottom-right" }}
              plugins={[{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> }]}
            />
          ) : null}
          <Toaster />
          <Scripts />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
