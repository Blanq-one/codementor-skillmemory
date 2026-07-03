import { MoonIcon, SunIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"

/** Dark/light toggle that drives [data-theme]. The whole redesign recolors
 *  through the token bridge, so this is the only control that changes theme. */
export function ThemeToggle({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-foreground text-sm transition-colors hover:border-[color-mix(in_srgb,var(--accent-recall)_45%,var(--border-hairline))]",
        className,
      )}
      onClick={toggle}
      type="button"
    >
      {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      {showLabel && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  )
}
