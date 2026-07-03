import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { SESSION } from "./session"

/** HUD top bar: brand, live session context as mono readouts, theme toggle. */
export function RedesignTopBar() {
  const { theme, toggle } = useTheme()

  return (
    <header className="sk-glass sticky top-0 z-20 flex h-14 items-center justify-between gap-4 px-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-6 items-center justify-center">
          <span className="absolute inset-0 rounded-[5px] bg-[var(--accent-recall)] opacity-20 blur-[6px]" />
          <span className="relative size-2.5 rounded-[3px] bg-[var(--accent-recall)] shadow-[var(--sk-glow-recall)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="sk-display font-bold text-[15px]">SkillMemory</span>
          <span className="sk-label hidden sm:inline">agent · code intelligence</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 md:flex">
          <span className="sk-label">repo</span>
          <span className="sk-mono text-[12px] text-foreground">{SESSION.targetRepo}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
          <span className="size-1.5 rounded-full bg-[var(--accent-recall)] shadow-[0_0_6px_var(--accent-recall)]" />
          <span className="sk-label">recalling</span>
        </div>
        <button
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-foreground text-sm transition-colors hover:border-[color-mix(in_srgb,var(--accent-recall)_45%,var(--border-hairline))]"
          onClick={toggle}
          type="button"
        >
          {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>
      </div>
    </header>
  )
}
