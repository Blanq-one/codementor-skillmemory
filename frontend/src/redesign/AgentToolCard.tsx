import { motion } from "motion/react"
import type { ToolUIPart } from "ai"
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import type { RunTool } from "./session"

/**
 * Wraps the AI Elements Tool card with motion: it materializes when the tool
 * starts, runs a cyan scan line while executing, and glows until it settles.
 * A pending tool is a slim queued stub, so the pipeline visibly fills in.
 *
 * Layering note: the glow lives on the OUTER element (no overflow) so the
 * box-shadow can escape; the scan line lives in an INNER overflow-hidden box
 * so it's clipped to the card.
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
        <span className="sk-label">queued</span>
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
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      layout
      style={{ boxShadow: running ? "var(--sk-glow-soft)" : undefined }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative overflow-hidden rounded-lg sk-glass" style={{ borderColor: accent }}>
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

        {running && (
          <motion.div
            animate={{ top: ["0%", "100%"] }}
            className="sk-scanline"
            style={{ top: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </motion.div>
  )
}
