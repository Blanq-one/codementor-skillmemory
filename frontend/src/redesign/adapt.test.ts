import { describe, it, expect } from "vitest"
import type { AskResult } from "@/api/client"
import { adaptAskResult, adaptSkills, parseReasoningSteps } from "./adapt"

describe("parseReasoningSteps — tool synthesis", () => {
  it("turns real 'Step N (agent): output' lines into completed tool cards", () => {
    const { tools, trace } = parseReasoningSteps([
      "Step 1 (retrieval): found 12 routes in app.py",
      "Step 2 (analyst): auth lives in handlers/auth.py",
    ])
    expect(tools).toHaveLength(2)
    expect(tools[0]).toMatchObject({ id: "step-1", type: "tool-retrieval", output: "found 12 routes in app.py" })
    expect(tools[1].type).toBe("tool-analyst")
    expect(trace.map((t) => t.label)).toEqual(["retrieval · step 1", "analyst · step 2"])
  })

  it("accepts capitalized agent tokens (lowercased)", () => {
    const { tools } = parseReasoningSteps(["Step 1 (Retrieval): x"])
    expect(tools).toHaveLength(1)
    expect(tools[0].type).toBe("tool-retrieval")
  })

  it("drops steps with an unknown agent (no phantom card)", () => {
    const { tools } = parseReasoningSteps(["Step 1 (hacker): rm -rf", "Step 2 (planner): nope"])
    expect(tools).toHaveLength(0)
  })

  it("does NOT create a card from lookalike prose in an answer-ish line", () => {
    const { tools, trace } = parseReasoningSteps([
      "Here are the steps: Step one, do X. Then step 2 (retrieval) is mentioned casually.",
    ])
    expect(tools).toHaveLength(0)
    expect(trace).toHaveLength(0)
  })

  it("keeps a lookalike inside a real step's OUTPUT as text, not a second card", () => {
    const { tools } = parseReasoningSteps([
      "Step 1 (retrieval): the handler prints 'Step 2 (retrieval): debug' as a log line",
    ])
    expect(tools).toHaveLength(1)
    expect(tools[0].output).toContain("Step 2 (retrieval): debug")
  })

  it("requires a numbered step — 'Step (agent):' with no number is dropped", () => {
    expect(parseReasoningSteps(["Step (retrieval): x"]).tools).toHaveLength(0)
  })

  it("maps Plan / Validation / Librarian lines to trace, not tools", () => {
    const { tools, trace } = parseReasoningSteps([
      'Plan: {"steps":[{"agent":"retrieval"},{"agent":"mentor"}]}',
      "Step 1 (retrieval): out",
      "Validation: Refined answer.",
      "Librarian: saved transferable skill -> trace auth flow",
    ])
    expect(tools).toHaveLength(1)
    const labels = trace.map((t) => t.label)
    expect(labels[0]).toBe("Planned approach") // unshifted to front
    expect(labels).toContain("Validated answer")
    expect(labels).toContain("Saved transferable skill")
    expect(trace.find((t) => t.label === "Planned approach")?.meta).toBe("2 steps")
  })

  it("handles a non-JSON Plan line without throwing (no meta)", () => {
    const { trace } = parseReasoningSteps(["Plan: could not build a plan"])
    expect(trace[0]).toMatchObject({ label: "Planned approach", meta: undefined })
  })

  it("is defensive against empty / undefined / blank input", () => {
    expect(parseReasoningSteps(undefined)).toEqual({ tools: [], trace: [] })
    expect(parseReasoningSteps([])).toEqual({ tools: [], trace: [] })
    expect(parseReasoningSteps(["", "   "])).toEqual({ tools: [], trace: [] })
  })
})

describe("adaptSkills — Recall Rail mapping", () => {
  it("maps used/ignored, source repo, and reason→note; no confidence", () => {
    const skills = adaptSkills([
      { method: "trace route → handler → middleware", source_repo: "pallets/flask", state: "used", reason: null },
      { method: "read .env first", source_repo: "expressjs/api", state: "ignored", reason: "repo uses pydantic Settings" },
    ])
    expect(skills[0]).toMatchObject({ method: "trace route → handler → middleware", sourceRepo: "pallets/flask", state: "used" })
    expect(skills[0].confidence).toBeUndefined()
    expect(skills[1]).toMatchObject({ state: "ignored", note: "repo uses pydantic Settings" })
  })

  it("falls back to 'unknown' when source_repo is blank", () => {
    expect(adaptSkills([{ method: "m", source_repo: "", state: "used" }])[0].sourceRepo).toBe("unknown")
  })

  it("is defensive against undefined", () => {
    expect(adaptSkills(undefined)).toEqual([])
  })
})

describe("adaptAskResult — end to end", () => {
  it("assembles answer, tools, trace, skills from a realistic AskResult", () => {
    const result: AskResult = {
      answer: "Auth is a dependency chain via `Depends(get_current_user)`.",
      citations: [],
      reasoning_steps: [
        'Plan: {"steps":[{"agent":"retrieval"}]}',
        "Step 1 (retrieval): routes in routers/auth.py",
        "Validation: Refined answer.",
      ],
      skills: [{ method: "trace auth flow", source_repo: "pallets/flask", state: "used", reason: null }],
    }
    const run = adaptAskResult(result)
    expect(run.answer).toContain("Depends")
    expect(run.tools).toHaveLength(1)
    expect(run.trace.map((t) => t.label)).toEqual(["Planned approach", "retrieval · step 1", "Validated answer"])
    expect(run.skills).toHaveLength(1)
  })
})
