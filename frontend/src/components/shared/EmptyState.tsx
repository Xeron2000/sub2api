import { Button } from "@/components/ui/button"

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {actionLabel && onAction && <Button size="sm" onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-destructive text-sm">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="space-y-3 p-4">
      <div className="bg-muted h-6 w-32 animate-pulse rounded-none" />
      <div className="bg-muted h-10 w-full animate-pulse rounded-none" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-8 w-full animate-pulse rounded-none" />
        ))}
      </div>
    </div>
  )
}
