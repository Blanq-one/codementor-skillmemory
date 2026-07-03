import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { ToolUIPart } from "ai"
import { RUN_TOOLS } from "./session"

export type RunPhase = "reasoning" | "tools" | "answering" | "done"

type ToolState = ToolUIPart["state"]

export type AgentRun = {
  phase: RunPhase
  toolState: Record<string, ToolState>
  answering: boolean
  /** how many recall cards have surfaced (0..3) */
  recalled: number
}

const FINAL: AgentRun = {
  phase: "done",
  toolState: Object.fromEntries(RUN_TOOLS.map((t) => [t.id, "output-available" as ToolState])),
  answering: false,
  recalled: 3,
}

/**
 * Orchestrates one scripted agent run for the flagship screen: reasoning →
 * tools executing one by one → answer streaming → settled. Recall cards
 * surface across the run. With prefers-reduced-motion, jumps straight to the
 * finished state so nothing animates.
 */
export function useAgentRun(): AgentRun {
  const reduced = useReducedMotion()
  const [run, setRun] = useState<AgentRun>(() => ({
    phase: "reasoning",
    toolState: Object.fromEntries(RUN_TOOLS.map((t) => [t.id, "input-streaming" as ToolState])),
    answering: false,
    recalled: 0,
  }))

  useEffect(() => {
    if (reduced) {
      setRun(FINAL)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
    const setTool = (id: string, state: ToolState) =>
      setRun((r) => ({ ...r, toolState: { ...r.toolState, [id]: state } }))

    at(350, () => setRun((r) => ({ ...r, recalled: 1 })))
    at(700, () => setRun((r) => ({ ...r, phase: "tools" })))

    at(900, () => setTool("t1", "input-available"))
    at(1700, () => setTool("t1", "output-available"))
    at(1800, () => setRun((r) => ({ ...r, recalled: 2 })))

    at(1900, () => setTool("t2", "input-available"))
    at(2700, () => setTool("t2", "output-available"))

    at(2800, () => setTool("t3", "input-available"))
    at(3600, () => setTool("t3", "output-available"))
    at(3700, () => setRun((r) => ({ ...r, recalled: 3 })))

    at(3800, () => setRun((r) => ({ ...r, phase: "answering", answering: true })))
    at(7200, () => setRun((r) => ({ ...r, phase: "done", answering: false })))

    return () => timers.forEach(clearTimeout)
  }, [reduced])

  return run
}
