import { SkillActivityAreaChart } from "@/components/charts/SkillActivityAreaChart"
import { SkillUsageBarChart } from "@/components/charts/SkillUsageBarChart"
import { SkillOutcomeDonutChart } from "@/components/charts/SkillOutcomeDonutChart"
import { Surface, Eyebrow, HudLabel, GlowDot, ScanLine, Reveal } from "../ui"

/**
 * Telemetry dashboard: the 3 charts dressed as a live instrument panel using
 * the extracted primitives. Charts read the --chart-* vars (mapped to the app
 * accents), so they recolor with the [data-theme] toggle. Static mock data.
 */

const KPIS = [
  { k: "skills", label: "Skills in memory", v: "312", note: "+18 this week", glow: true },
  { k: "repos", label: "Repos ingested", v: "47", note: "6 languages" },
  { k: "recall", label: "Recall hit rate", v: "78%", note: "last 30 sessions" },
  { k: "adapt", label: "Cold-start speedup", v: "1.9×", note: "vs no memory" },
]

function LiveTag() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <GlowDot pulse />
      <HudLabel>live</HudLabel>
    </span>
  )
}

export function DashboardPanel() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((m, i) => (
          <Reveal delay={i * 0.05} key={m.k}>
            <Surface className="rounded-[var(--sk-radius-lg)] p-4" glow={m.glow ? "recall" : "none"}>
              <Eyebrow>{m.label}</Eyebrow>
              <div className="sk-display font-semibold text-3xl tabular-nums">{m.v}</div>
              <HudLabel className="mt-1 block">{m.note}</HudLabel>
            </Surface>
          </Reveal>
        ))}
      </div>

      {/* Wide activity chart, dressed as a live feed */}
      <Reveal delay={0.15}>
        <Surface className="relative mt-4 overflow-hidden rounded-[var(--sk-radius-lg)] p-4">
          <ScanLine />
          <div className="mb-3 flex items-center justify-between gap-3">
            <Eyebrow className="mb-0">Skill activity · learned vs recalled</Eyebrow>
            <LiveTag />
          </div>
          <SkillActivityAreaChart />
        </Surface>
      </Reveal>

      {/* Paired panels */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal delay={0.2}>
          <Surface className="rounded-[var(--sk-radius-lg)] p-4">
            <Eyebrow>Applied vs ignored · per repo</Eyebrow>
            <SkillUsageBarChart />
          </Surface>
        </Reveal>
        <Reveal delay={0.25}>
          <Surface className="rounded-[var(--sk-radius-lg)] p-4">
            <Eyebrow>Recall outcomes</Eyebrow>
            <SkillOutcomeDonutChart />
          </Surface>
        </Reveal>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Static mock telemetry. Wiring to the live Cognee skill graph is a later step.
      </p>
    </div>
  )
}
