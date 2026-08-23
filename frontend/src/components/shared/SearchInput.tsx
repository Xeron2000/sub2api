import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function SearchInput({ value, onChange, placeholder = "Search", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  useEffect(() => {
    const t = setTimeout(() => { if (local !== value) onChange(local) }, 300)
    return () => clearTimeout(t)
  }, [local, value, onChange])
  const clear = () => { setLocal(""); onChange("") }
  return (
    <div className="relative flex-1 max-w-sm">
      <Input placeholder={placeholder} value={local} onChange={(e) => setLocal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onChange(local) }} className={className} />
      {local && (
        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={clear} aria-label="Clear search">
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
