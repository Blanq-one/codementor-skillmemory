import { Surface, BrandMark, Chip, GlowDot, HudLabel, ThemeToggle } from "./ui"
import { SESSION } from "./session"

/** Chat top bar, now composed from shell primitives. Brand stays here because
 *  the standalone /_chat has no sidebar yet; in the AppShell (step 3) the brand
 *  moves to the rail and this becomes a ShellTopBar. */
export function RedesignTopBar() {
  return (
    <Surface
      as="header"
      className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 px-4"
    >
      <div className="flex items-center gap-3">
        <BrandMark />
        <div className="flex items-baseline gap-2">
          <span className="sk-display font-bold text-[15px]">SkillMemory</span>
          <HudLabel className="hidden sm:inline">agent · code intelligence</HudLabel>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Chip className="hidden md:inline-flex" label="repo">
          {SESSION.targetRepo}
        </Chip>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
          <GlowDot pulse />
          <HudLabel>recalling</HudLabel>
        </span>
        <ThemeToggle />
      </div>
    </Surface>
  )
}
