import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { HudLabel } from "./HudLabel"

/** Bordered readout chip: a HUD label and/or a mono value. Used for repo,
 *  stack, model, and metric chips in the top bar and prompt bar. */
export function Chip({
  label,
  tone,
  className,
  children,
}: {
  label?: ReactNode
  tone?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5",
        className,
      )}
    >
      {label != null && <HudLabel tone={tone}>{label}</HudLabel>}
      {children != null && <span className="sk-mono text-[12px] text-foreground">{children}</span>}
    </span>
  )
}
