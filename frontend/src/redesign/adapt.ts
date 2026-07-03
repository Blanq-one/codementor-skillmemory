import type { ToolUIPart } from "ai"
import type { AskResult, Skill } from "@/api/client"
import type { RecalledSkill, RunTool } from "./session"

/**
 * Adapts the backend AskResult (see codeatlas ask_controller / orchestration)
 * into the redesign's view models. The backend does not emit structured tool
 * calls — only free-text `reasoning_steps` — so tool cards and trace are
 * synthesized here, defensively.
 *
 * Defensiveness (flag 2): each element of `reasoning_steps` is one line the
 * backend emitted with a known prefix ("Step N (agent): ...", "Plan: ...",
 * "Validation: ...", "Librarian: ..."). We match ONLY those exact prefixes on
 * the START of each element, and only accept a tool step when the agent is one
 * the orchestrator actually runs. Anything ambiguous is dropped rather than
 * rendered, so stray answer text never produces a phantom tool card. Because we
 * parse per array-element (not per newline), a lookalike "Step k (agent):"
 * appearing inside a step's own output stays inside that card's output — it
 * cannot spawn a second card.
 */

// Agents the orchestrator dispatches to (orchestration._route_step).
const KNOWN_AGENTS = new Set(["retrieval", "analyst", "mentor", "memory"])

// Anchored to start-of-string. Number is required; agent is a bare token.
const STEP_RE = /^Step\s+(\d+)\s+\(([A-Za-z_]+)\):\s*([\s\S]*)$/
const PLAN_RE = /^Plan:\s*([\s\S]*)$/
const VALIDATION_RE = /^Validation:\s*(.*)$/
const LIBRARIAN_RE = /^Librarian:\s*([\s\S]*)$/

export type TraceStep = { label: string; meta?: string; status: "complete" | "active" | "pending" }

export type AdaptedRun = {
  tools: RunTool[]
  trace: TraceStep[]
  answer: string
  skills: RecalledSkill[]
}

export function parseReasoningSteps(steps: readonly string[] | undefined): {
  tools: RunTool[]
  trace: TraceStep[]
} {
  const tools: RunTool[] = []
  const trace: TraceStep[] = []

  for (const raw of steps ?? []) {
    if (typeof raw !== "string") continue
    const line = raw.trim()
    if (!line) continue

    const step = STEP_RE.exec(line)
    if (step) {
      const n = step[1]
      const agent = step[2].toLowerCase()
      const output = step[3].trim()
      // Unknown agent => ambiguous => drop (no phantom card).
      if (!KNOWN_AGENTS.has(agent)) continue
      tools.push({
        id: `step-${n}`,
        type: `tool-${agent}` as ToolUIPart["type"],
        input: { agent, step: Number(n) },
        output,
      })
      trace.push({ label: `${agent} · step ${n}`, status: "complete" })
      continue
    }

    const plan = PLAN_RE.exec(line)
    if (plan) {
      let meta: string | undefined
      try {
        const parsed = JSON.parse(plan[1]) as { steps?: unknown }
        if (Array.isArray(parsed?.steps)) meta = `${parsed.steps.length} steps`
      } catch {
        /* non-JSON plan text — no meta, still a real trace line */
      }
      trace.unshift({ label: "Planned approach", meta, status: "complete" })
      continue
    }

    if (VALIDATION_RE.test(line)) {
      trace.push({ label: "Validated answer", status: "complete" })
      continue
    }

    if (LIBRARIAN_RE.test(line)) {
      trace.push({ label: "Saved transferable skill", status: "complete" })
      continue
    }

    // Unrecognized => drop.
  }

  return { tools, trace }
}

export function adaptSkills(skills: readonly Skill[] | undefined): RecalledSkill[] {
  return (skills ?? []).map((s, i) => ({
    id: `skill-${i}`,
    method: s.method,
    sourceRepo: s.source_repo || "unknown",
    state: s.state === "used" ? "used" : "ignored",
    note: s.reason ?? undefined,
  }))
}

export function adaptAskResult(result: AskResult): AdaptedRun {
  const { tools, trace } = parseReasoningSteps(result.reasoning_steps)
  return { tools, trace, answer: result.answer, skills: adaptSkills(result.skills) }
}
