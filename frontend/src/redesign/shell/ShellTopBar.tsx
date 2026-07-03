import type { ReactNode } from "react"
import { Surface, HudLabel, ThemeToggle } from "../ui"

/**
 * Generic top bar for shell screens. Brand lives in the sidebar, so this
 * carries the section title (left), a context slot (chips/status), an actions
 * slot, and always the theme toggle.
 */
export function ShellTopBar({
  title,
  eyebrow,
  context,
  actions,
}: {
  title: ReactNode
  eyebrow?: string
  context?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Surface
      as="header"
      className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 px-4"
    >
      <div className="flex flex-col justify-center">
        {eyebrow && <HudLabel>{eyebrow}</HudLabel>}
        <span className="sk-display font-semibold text-[15px] leading-tight">{title}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {context}
        {actions}
        <ThemeToggle />
      </div>
    </Surface>
  )
}
