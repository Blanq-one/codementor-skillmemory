import { motion } from "motion/react"
import type { ToolUIPart } from "ai"
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { Surface, ScanLine, Reveal, HudLabel } from "./ui"
import type { RunTool } from "./session"

/**
 * Wraps the AI Elements Tool card with motion: it materializes when the tool
 * starts, runs a cyan scan line while executing, and glows until it settles.
 * A pending tool is a slim queued stub, so the pipeline visibly fills in.
 *
 * Layering: the glow lives on the OUTER Reveal (no overflow) so the box-shadow
 * can escape; the ScanLine lives in the INNER overflow-hidden Surface.
 */
export function AgentToolCard({ tool, state }: { tool: RunTool; state: ToolUIPart["state"] }) {
  const pending = state === "input-streaming"
  const running = state === "input-available"
  const errored = state === "output-error"
  const name = tool.type.split("-").slice(1).join("_")

  if (pending) {
    return (
      <motion.div
        className="flex items-center gap-2 rounded-md border border-dashed border-border/70 px-3 py-2"
        layout
      >
        <span className="size-1.5 rounded-full bg-[var(--text-muted)]" />
        <HudLabel>queued</HudLabel>
        <span className="sk-mono text-muted-foreground text-xs">{name}</span>
      </motion.div>
    )
  }

  const accent = running
    ? "color-mix(in srgb, var(--accent-recall) 55%, var(--border-hairline))"
    : errored
      ? "color-mix(in srgb, var(--accent-danger) 55%, var(--border-hairline))"
      : "var(--border-hairline)"

  return (
    <Reveal
      className="rounded-lg"
      duration={0.32}
      layout
      style={{ boxShadow: running ? "var(--sk-glow-soft)" : undefined }}
      y={10}
    >
      <Surface className="relative overflow-hidden rounded-lg" style={{ borderColor: accent }}>
        <Tool className="border-0 bg-transparent" defaultOpen>
          <ToolHeader state={state} type={tool.type} />
          <ToolContent>
            <ToolInput input={tool.input} />
            <ToolOutput
              errorText={errored ? "Timed out after 30s" : undefined}
              output={running ? undefined : <span className="sk-mono text-xs">{tool.output}</span>}
            />
          </ToolContent>
        </Tool>

        {running && <ScanLine />}
      </Surface>
    </Reveal>
  )
}
