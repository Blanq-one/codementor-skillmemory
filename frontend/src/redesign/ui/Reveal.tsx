import { motion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"
import { SK_EASE } from "./motion"

/**
 * Standard entrance wrapper: fade + rise on mount. Distance/duration default to
 * the screen-1 values; pass `y`/`duration`/`delay` to match a specific spot.
 * `layout` opts into layout animation. Under MotionConfig reducedMotion="user"
 * (set by AppShell) this collapses to no movement.
 */
export function Reveal({
  children,
  y = 12,
  duration = 0.4,
  delay = 0,
  layout = false,
  className,
  style,
}: {
  children: ReactNode
  y?: number
  duration?: number
  delay?: number
  layout?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y }}
      layout={layout}
      style={style}
      transition={{ duration, delay, ease: SK_EASE }}
    >
      {children}
    </motion.div>
  )
}
