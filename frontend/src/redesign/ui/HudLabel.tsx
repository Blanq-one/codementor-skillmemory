import type { ComponentPropsWithoutRef, CSSProperties } from "react"
import { cn } from "@/lib/utils"

/** Mono, uppercase, tracked micro-label — the HUD readout voice. `tone` sets
 *  the color (defaults to muted via .sk-label). */
export function HudLabel({
  tone,
  className,
  style,
  ...props
}: { tone?: string } & ComponentPropsWithoutRef<"span">) {
  const merged: CSSProperties | undefined = tone ? { color: tone, ...style } : style
  return <span className={cn("sk-label", className)} style={merged} {...props} />
}
