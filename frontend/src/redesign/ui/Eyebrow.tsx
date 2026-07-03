import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { HudLabel } from "./HudLabel"

/** Section eyebrow: a HUD label followed by a hairline rule. Structural, used
 *  where content has real sections (Execution, Answer, panel headers). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2 flex items-center gap-2", className)}>
      <HudLabel>{children}</HudLabel>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
