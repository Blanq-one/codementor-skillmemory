import { lazy, Suspense } from "react"

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { CodeBlock } from "@/components/ai-elements/code-block"

import { Reveal, Eyebrow } from "../ui"
import { RecallRail } from "../RecallRail"
import { PromptBar } from "../PromptBar"
import { AgentToolCard } from "../AgentToolCard"
import { StreamingResponse } from "../StreamingResponse"
import { useAgentRun } from "../useAgentRun"
import { ANSWER_CODE, ANSWER_MD, CHAIN_STEPS, QUESTION, REASONING_MD, RUN_TOOLS } from "../session"

const AmbientGraph = lazy(() => import("../AmbientGraph"))

/**
 * Chat content for the AppShell (no top bar / frame of its own — the shell
 * provides those). Conversation + ambient graph + prompt bar on the left,
 * the Recall Rail signature on the right.
 */
export function ChatPanel() {
  const run = useAgentRun()
  const showTools = run.phase !== "reasoning"
  const showTrace = run.phase === "answering" || run.phase === "done"
  const showAnswer = run.phase === "answering" || run.phase === "done"

  return (
    <div className="mx-auto grid h-full w-full max-w-[1220px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="relative flex min-h-[70vh] flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Suspense fallback={null}>
            <AmbientGraph />
          </Suspense>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-5 py-2">
              <Message from="user">
                <MessageContent>{QUESTION}</MessageContent>
              </Message>

              <Message from="assistant">
                <MessageContent className="w-full max-w-full gap-4">
                  <Reveal>
                    <Reasoning defaultOpen>
                      <ReasoningTrigger />
                      <ReasoningContent>{REASONING_MD}</ReasoningContent>
                    </Reasoning>
                  </Reveal>

                  {showTools && (
                    <Reveal>
                      <Eyebrow>Execution</Eyebrow>
                      <div className="flex flex-col gap-2">
                        {RUN_TOOLS.map((t) => (
                          <AgentToolCard key={t.id} state={run.toolState[t.id]} tool={t} />
                        ))}
                      </div>
                    </Reveal>
                  )}

                  {showTrace && (
                    <Reveal>
                      <ChainOfThought defaultOpen>
                        <ChainOfThoughtHeader>Trace</ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {CHAIN_STEPS.map((s, i) => (
                            <ChainOfThoughtStep description={s.meta} key={i} label={s.label} status={s.status} />
                          ))}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    </Reveal>
                  )}

                  {showAnswer && (
                    <Reveal>
                      <Eyebrow>Answer</Eyebrow>
                      <StreamingResponse active={run.phase === "answering"} text={ANSWER_MD} />
                      <div className="mt-3">
                        <CodeBlock code={ANSWER_CODE} language="python" showLineNumbers />
                      </div>
                    </Reveal>
                  )}
                </MessageContent>
              </Message>
            </ConversationContent>
          </Conversation>

          <div className="pt-4">
            <PromptBar />
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <div className="sticky top-[72px]">
          <RecallRail revealed={run.recalled} />
        </div>
      </div>
    </div>
  )
}
