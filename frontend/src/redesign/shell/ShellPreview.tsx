import { useState } from "react"
import { AppShell } from "./AppShell"
import { ShellTopBar } from "./ShellTopBar"
import type { NavId } from "./Sidebar"
import { Surface, Eyebrow, HudLabel, Chip, GlowDot, ScanLine, Reveal } from "../ui"

/**
 * Dev preview of the extracted shell + primitives (/_shell). Placeholder
 * content only — step 3 replaces this main area with the real dashboard. Its
 * job here is to let the shell, sidebar, and surface/label/chip/glow/scan
 * primitives be reviewed together before propagation.
 */
export function ShellPreview() {
  const [active, setActive] = useState<NavId>("dashboard")

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      topBar={
        <ShellTopBar
          context={
            <>
              <Chip label="repo">acme/payments-api</Chip>
              <Chip className="hidden md:inline-flex">
                <GlowDot pulse />
                <HudLabel>live</HudLabel>
              </Chip>
            </>
          }
          eyebrow={`section · ${active}`}
          title="Shell preview"
        />
      }
    >
      <div className="mx-auto max-w-[1100px] px-5 py-6">
        <Reveal>
          <p className="mb-5 max-w-2xl text-muted-foreground text-sm">
            The frame, rail, and primitives that the dashboard and the rest of the app will reuse.
            Click the rail icons to move the active state; toggle theme to confirm everything recolors
            through the bridge. Placeholder content — real telemetry lands in step 3.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { k: "skills", label: "Skills in memory", v: "312", note: "across 47 repos" },
            { k: "recall", label: "Recall hit rate", v: "78%", note: "last 30 sessions" },
            { k: "adapt", label: "Adapted on transfer", v: "1.9x", note: "vs cold start" },
          ].map((m, i) => (
            <Reveal delay={i * 0.06} key={m.k}>
              <Surface className="rounded-[var(--sk-radius-lg)] p-4" glow={i === 0 ? "recall" : "none"}>
                <Eyebrow>{m.label}</Eyebrow>
                <div className="sk-display font-semibold text-3xl">{m.v}</div>
                <HudLabel className="mt-1 block">{m.note}</HudLabel>
              </Surface>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <Surface className="relative mt-4 overflow-hidden rounded-[var(--sk-radius-lg)] p-4">
            <ScanLine />
            <Eyebrow>Live ingestion</Eyebrow>
            <div className="flex items-center gap-2">
              <GlowDot pulse />
              <span className="sk-mono text-sm text-foreground">
                indexing acme/payments-api — 214 files, 18 dirs
              </span>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              A Surface with a ScanLine reads as an active/streaming panel. The dashboard&apos;s live
              telemetry will use this exact treatment.
            </p>
          </Surface>
        </Reveal>
      </div>
    </AppShell>
  )
}

export default ShellPreview
