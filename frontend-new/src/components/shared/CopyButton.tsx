import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setCopied(true)
              setFailed(false)
              window.setTimeout(() => setCopied(false), 1500)
            } catch {
              setFailed(true)
              setCopied(false)
              window.setTimeout(() => setFailed(false), 1500)
            }
          }}
          aria-label={label}
        >
          {failed ? "Failed" : copied ? "Copied" : label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{failed ? "Failed to copy" : copied ? "Copied!" : label}</TooltipContent>
    </Tooltip>
  )
}
