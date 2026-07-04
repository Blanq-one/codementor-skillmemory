import type { ReactNode } from "react"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Sidebar, type NavId } from "./Sidebar"

import "../../styles/redesign.css"

/**
 * The application frame: depth background, sidebar rail, and a slot for the top
 * bar + page content. `reducedMotion="user"` makes every motion component in
 * the tree honor prefers-reduced-motion without per-component checks.
 */
export function AppShell({
  active,
  onNavigate,
  onHome,
  topBar,
  children,
}: {
  active?: NavId
  onNavigate?: (id: NavId) => void
  onHome?: () => void
  topBar?: ReactNode
  children: ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={120}>
        <div className="sk-app flex min-h-screen">
          <Sidebar active={active} onHome={onHome} onNavigate={onNavigate} />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            {topBar}
            <main className="min-h-0 flex-1">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </MotionConfig>
  )
}
