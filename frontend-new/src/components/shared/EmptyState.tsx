import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n"

export function EmptyState({
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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm font-medium">{resolvedTitle}</p>
        {resolvedDescription ? <p className="text-sm text-muted-foreground max-w-md">{resolvedDescription}</p> : null}
        {action}
      </CardContent>
    </Card>
  )
}
