import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Glass surface — the redesign's core panel. `variant` picks blur strength,
 * `glow` adds the cyan phosphor shadow, `as` lets it render any element
 * (header, aside, section) while keeping the treatment identical.
 */
type SurfaceProps = {
  variant?: "glass" | "strong"
  glow?: "none" | "soft" | "recall"
  as?: ElementType
  className?: string
  style?: CSSProperties
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<"div">, "style" | "className" | "children">

export function Surface({ variant = "glass", glow = "none", as, className, ...props }: SurfaceProps) {
  const Comp = (as ?? "div") as ElementType
  return (
    <Comp
      className={cn(
        variant === "strong" ? "sk-glass-strong" : "sk-glass",
        glow === "soft" && "sk-glow-soft",
        glow === "recall" && "sk-glow-recall",
        className,
      )}
      {...props}
    />
  )
}
