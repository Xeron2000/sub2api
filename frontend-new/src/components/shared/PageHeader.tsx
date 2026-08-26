import type { ReactNode } from "react"
import { useTranslation } from "@/i18n"

export function PageHeader({
  title,
  titleKey,
  description,
  descriptionKey,
  action,
}: {
  title?: string
  titleKey?: string
  description?: string
  descriptionKey?: string
  action?: ReactNode
}) {
  const { t } = useTranslation()
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? "")
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{resolvedTitle}</h1>
        {resolvedDescription ? <p className="text-sm text-muted-foreground">{resolvedDescription}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}
