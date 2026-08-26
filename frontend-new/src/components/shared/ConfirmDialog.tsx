
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  titleKey,
  description,
  descriptionKey,
  confirmLabel,
  confirmLabelKey,
  variant = "default",
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  titleKey?: string
  description?: string
  descriptionKey?: string
  confirmLabel?: string
  confirmLabelKey?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  loading?: boolean
}) {
  const { t } = useTranslation()
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? "")
  const resolvedDescription = descriptionKey ? t(descriptionKey) : (description ?? "")
  const resolvedConfirm = confirmLabelKey ? t(confirmLabelKey) : (confirmLabel ?? t("common.confirm"))
  const cancelLabel = t("common.cancel")
  const processingLabel = t("common.processing")
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={variant === "destructive" ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
              {loading ? processingLabel : resolvedConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteConfirmDialog(props: Omit<Parameters<typeof ConfirmDialog>[0], "variant" | "confirmLabel"> & { confirmLabel?: string }) {
  return <ConfirmDialog {...props} variant="destructive" confirmLabel={props.confirmLabel ?? "Delete"} />
}
