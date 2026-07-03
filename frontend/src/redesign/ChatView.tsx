import { lazy, Suspense } from "react"

import "../styles/redesign.css"
import { TooltipProvider } from "@/components/ui/tooltip"
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

import { Reveal, Eyebrow } from "./ui"
import { RedesignTopBar } from "./RedesignTopBar"
import { RecallRail } from "./RecallRail"
import { PromptBar } from "./PromptBar"
import { AgentToolCard } from "./AgentToolCard"
import { StreamingResponse } from "./StreamingResponse"
import { useAgentRun } from "./useAgentRun"
import {
  ANSWER_CODE,
  ANSWER_MD,
  CHAIN_STEPS,
  QUESTION,
  REASONING_MD,
  RUN_TOOLS,
} from "./session"

// Ambient backdrop is code-split so it never blocks first paint.
const AmbientGraph = lazy(() => import("./AmbientGraph"))

export function ChatView() {
  const run = useAgentRun()
  const showTools = run.phase !== "reasoning"
  const showTrace = run.phase === "answering" || run.phase === "done"
  const showAnswer = run.phase === "answering" || run.phase === "done"

  return (
    <TooltipProvider>
      <div className="sk-app flex min-h-screen flex-col">
        <RedesignTopBar />

        <main className="mx-auto grid w-full max-w-[1220px] flex-1 grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Conversation column with ambient graph behind it */}
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
                      {/* Reasoning: the recalled + adapted skill */}
                      <Reveal>
                        <Reasoning defaultOpen>
                          <ReasoningTrigger />
                          <ReasoningContent>{REASONING_MD}</ReasoningContent>
                        </Reasoning>
                      </Reveal>

                      {/* Execution pipeline */}
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

                      {/* Trace */}
                      {showTrace && (
                        <Reveal>
                          <ChainOfThought defaultOpen>
                            <ChainOfThoughtHeader>Trace</ChainOfThoughtHeader>
                            <ChainOfThoughtContent>
                              {CHAIN_STEPS.map((s, i) => (
                                <ChainOfThoughtStep
                                  description={s.meta}
                                  key={i}
                                  label={s.label}
                                  status={s.status}
                                />
                              ))}
                            </ChainOfThoughtContent>
                          </ChainOfThought>
                        </Reveal>
                      )}

                      {/* Answer */}
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

          {/* Recall rail — the signature */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <RecallRail revealed={run.recalled} />
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default ChatView
