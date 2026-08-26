import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/i18n"

export function PageSection({
  title,
  titleKey,
  description,
  descriptionKey,
  children,
  action,
}: {
  title?: string
  titleKey?: string
  description?: string
  descriptionKey?: string
  children: ReactNode
  action?: ReactNode
}) {
  const { t } = useTranslation()
  const resolvedTitle = titleKey ? t(titleKey) : title
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description
  if (!resolvedTitle) return <div className="space-y-4">{children}</div>
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{resolvedTitle}</CardTitle>
          {resolvedDescription ? <CardDescription>{resolvedDescription}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
