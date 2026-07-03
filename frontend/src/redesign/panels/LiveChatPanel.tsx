import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { ChatStatus } from "ai"

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { askQuestion, fetchRepos, repoLabel } from "@/api/client"

import { Reveal, Eyebrow, Surface, HudLabel, GlowDot, ScanLine } from "../ui"
import { RecallRail } from "../RecallRail"
import { PromptBar } from "../PromptBar"
import { AgentToolCard } from "../AgentToolCard"
import { StreamingResponse } from "../StreamingResponse"
import { adaptAskResult, type AdaptedRun } from "../adapt"

const AmbientGraph = lazy(() => import("../AmbientGraph"))

type Turn = {
  id: number
  question: string
  status: "loading" | "done" | "error"
  run?: AdaptedRun
  error?: string
}

/** In-flight placeholder: a scanning panel that stands in for the pipeline
 *  while /ask is outstanding (the backend is not streaming, so this reflects
 *  request lifecycle, not per-tool timing). */
function PendingRun() {
  return (
    <Surface className="relative overflow-hidden rounded-lg p-3">
      <ScanLine />
      <div className="flex items-center gap-2">
        <GlowDot pulse />
        <Shimmer>Recalling skills, retrieving code, reasoning…</Shimmer>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {["recall memory", "retrieve code", "reason over results"].map((label) => (
          <div className="flex items-center gap-2 rounded-md border border-border border-dashed px-3 py-2" key={label}>
            <span className="size-1.5 rounded-full bg-[var(--text-muted)]" />
            <HudLabel>{label}</HudLabel>
          </div>
        ))}
      </div>
    </Surface>
  )
}

function DoneRun({ run, streaming }: { run: AdaptedRun; streaming: boolean }) {
  return (
    <div className="flex w-full max-w-full flex-col gap-4">
      {run.tools.length > 0 && (
        <Reveal>
          <Eyebrow>Execution</Eyebrow>
          <div className="flex flex-col gap-2">
            {run.tools.map((t) => (
              <AgentToolCard key={t.id} state="output-available" tool={t} />
            ))}
          </div>
        </Reveal>
      )}

      {run.trace.length > 0 && (
        <Reveal>
          <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader>Trace</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {run.trace.map((s, i) => (
                <ChainOfThoughtStep description={s.meta} key={i} label={s.label} status={s.status} />
              ))}
            </ChainOfThoughtContent>
          </ChainOfThought>
        </Reveal>
      )}

      <Reveal>
        <Eyebrow>Answer</Eyebrow>
        <StreamingResponse active={streaming} text={run.answer || "_No answer returned._"} />
      </Reveal>
    </div>
  )
}

/** Live chat wired to the real /ask backend via the existing api/client. */
export function LiveChatPanel() {
  const [repos, setRepos] = useState<string[]>([])
  const [repo, setRepo] = useState("")
  const [reposLoaded, setReposLoaded] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchRepos(ctrl.signal)
      .then((rs) => {
        setRepos(rs)
        setRepo((prev) => prev || rs[0] || "")
      })
      .catch(() => {
        /* surfaced via reposLoaded + empty repos */
      })
      .finally(() => setReposLoaded(true))
    return () => ctrl.abort()
  }, [])

  const submit = (text: string) => {
    const id = ++idRef.current
    if (!repo) {
      setTurns((t) => [
        ...t,
        { id, question: text, status: "error", error: "No repository ingested. Run POST /analyze-repo first." },
      ])
      return
    }
    setTurns((t) => [...t, { id, question: text, status: "loading" }])
    askQuestion(repo, text)
      .then((res) => {
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "done", run: adaptAskResult(res) } : x)))
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "The request failed."
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "error", error: message } : x)))
      })
  }

  const anyLoading = turns.some((t) => t.status === "loading")
  const status: ChatStatus = anyLoading ? "submitted" : "ready"
  const latestId = turns.at(-1)?.id
  const lastDone = [...turns].reverse().find((t) => t.status === "done")
  const railSkills = lastDone?.run?.skills ?? []

  return (
    <div className="mx-auto grid h-full w-full max-w-[1220px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="relative flex min-h-[70vh] flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Suspense fallback={null}>
            <AmbientGraph />
          </Suspense>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center gap-2 px-1">
            <HudLabel>repo</HudLabel>
            <span className="sk-mono text-[12px] text-foreground">
              {reposLoaded ? (repo ? repoLabel(repo) : "none ingested") : "loading…"}
            </span>
          </div>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-5 py-2">
              {turns.length === 0 && (
                <div className="py-10 text-center">
                  <HudLabel className="block">live · wired to /ask</HudLabel>
                  <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
                    {reposLoaded && repos.length === 0
                      ? "No repositories ingested yet. Run POST /analyze-repo, then ask."
                      : "Ask a question below. The agent recalls skills from prior repos as it answers."}
                  </p>
                </div>
              )}

              {turns.map((turn) => (
                <div className="flex flex-col gap-5" key={turn.id}>
                  <Message from="user">
                    <MessageContent>{turn.question}</MessageContent>
                  </Message>
                  <Message from="assistant">
                    <MessageContent className="w-full max-w-full gap-4">
                      {turn.status === "loading" && <PendingRun />}
                      {turn.status === "error" && (
                        <Surface
                          className="rounded-lg p-3 text-[13px] text-foreground"
                          style={{ borderColor: "color-mix(in srgb, var(--accent-danger) 55%, var(--border-hairline))" }}
                        >
                          <HudLabel tone="var(--accent-danger)">request failed</HudLabel>
                          <p className="mt-1 text-muted-foreground">{turn.error}</p>
                        </Surface>
                      )}
                      {turn.status === "done" && turn.run && (
                        <DoneRun run={turn.run} streaming={turn.id === latestId} />
                      )}
                    </MessageContent>
                  </Message>
                </div>
              ))}
            </ConversationContent>
          </Conversation>

          <div className="pt-4">
            <PromptBar onSubmit={submit} status={status} />
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <div className="sticky top-[72px]">
          <RecallRail skills={railSkills} />
        </div>
      </div>
    </div>
  )
}
