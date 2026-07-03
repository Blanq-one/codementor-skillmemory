import { cn } from "@/lib/utils"

/** Status dot with a matching glow. `pulse` breathes it (killed under
 *  prefers-reduced-motion via .sk-pulse in redesign.css). */
export function GlowDot({
  color = "var(--accent-recall)",
  size = 6,
  pulse = false,
  className,
}: {
  color?: string
  size?: number
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", pulse && "sk-pulse", className)}
      style={{ width: size, height: size, background: color, boxShadow: `0 0 6px ${color}` }}
    />
  )
}
