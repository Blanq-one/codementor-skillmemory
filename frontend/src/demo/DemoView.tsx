/**
 * DEV-ONLY component gallery. Not part of the real app.
 * Reachable at /_demo in `npm run dev` (see main.tsx); excluded from prod builds.
 *
 * Purpose: put the whole free/OSS stack on one screen with STATIC props (no
 * backend) so the theme bridge can be eyeballed. The dark/light button toggles
 * [data-theme] on <html>; every component below should recolor in one click.
 *
 * PREFLIGHT WATCH: Tailwind Preflight is intentionally off (coexist mode), so
 * components that emit raw <p>/<ul>/<h*> keep browser default margins/bullets.
 * Observed spots are listed in the "Preflight watch" panel and left UNFIXED on
 * purpose, so you can decide where a scoped reset is worth adding.
 */
import { useState, type ReactNode } from "react"
import { MoonIcon, SunIcon, SearchIcon, FileCodeIcon, GitBranchIcon } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/useTheme"

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { CodeBlock } from "@/components/ai-elements/code-block"
import { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile } from "@/components/ai-elements/task"
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion"
import { Shimmer } from "@/components/ai-elements/shimmer"

import { SkillActivityAreaChart } from "@/components/charts/SkillActivityAreaChart"
import { SkillUsageBarChart } from "@/components/charts/SkillUsageBarChart"
import { SkillOutcomeDonutChart } from "@/components/charts/SkillOutcomeDonutChart"

// Section chrome uses <div>, not <h*>, so the gallery frame itself has no
// Preflight-dependent margins. Only the components' own internals are observed.
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="font-semibold text-sm text-foreground">{title}</div>
        {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
      </div>
      {children}
    </section>
  )
}

const PY_SAMPLE = `def find_auth_flow(app):
    # skill: route -> handler -> middleware
    routes = app.url_map.iter_rules()
    for rule in routes:
        handler = app.view_functions[rule.endpoint]
        yield rule, handler  # follow into middleware next`

const REASONING_MD = `I recognized this as a **web-app auth** question, so I recalled the skill:

1. locate route registration
2. follow the route to its handler
3. follow the handler into middleware

Then I mapped it onto \`app.py\` in this repo.`

const RESPONSE_MD = `Auth is wired in three hops:

- **Routes** register in \`app.py\` via \`@app.route\`
- Each route points to a **handler** in \`handlers/\`
- Handlers wrap in \`require_auth\` **middleware**

That middleware is where the token check lives.`

export function DemoView() {
  const { theme, toggle } = useTheme()
  const [picked, setPicked] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-6 text-foreground">
        {/* Header + on-view theme toggle */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-lg">Component stack — dev gallery</div>
            <div className="text-muted-foreground text-sm">
              Static props, no backend. Toggle theme to confirm the bridge recolors everything.
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground text-sm transition-colors hover:bg-muted"
            onClick={toggle}
            type="button"
          >
            {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            {theme === "dark" ? "Light" : "Dark"} ({theme})
          </button>
        </div>

        {/* Preflight watch */}
        <div className="mb-6 rounded-lg border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/8 p-3 text-sm">
          <div className="mb-1 font-semibold">Preflight watch (unfixed on purpose)</div>
          <ul className="ml-5 list-disc text-muted-foreground">
            <li>Reasoning trigger "Thought for..." renders a bare &lt;p&gt; (UA top/bottom margin).</li>
            <li>Shimmer renders as &lt;p&gt; by default (UA margin).</li>
            <li>Reasoning + Message markdown (Streamdown) uses UA heading/list spacing and bullets.</li>
          </ul>
          <div className="mt-1 text-muted-foreground text-xs">
            This very panel's &lt;ul&gt; is styled with explicit <code>list-disc ml-5</code> because
            Preflight would otherwise strip bullets. That is the scoped-reset decision to make.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Tool-call cards in several states */}
          <Section title="Tool — tool-call cards" hint="AI-SDK ToolUIPart shape">
            <div className="space-y-3">
              <Tool defaultOpen>
                <ToolHeader state="output-available" type="tool-locate_route_registration" />
                <ToolContent>
                  <ToolInput input={{ repo: "flask", query: "route registration" }} />
                  <ToolOutput
                    errorText={undefined}
                    output={<span>Found 12 routes in <code>app.py</code></span>}
                  />
                </ToolContent>
              </Tool>
              <Tool>
                <ToolHeader state="input-available" type="tool-follow_to_handler" />
                <ToolContent>
                  <ToolInput input={{ endpoint: "auth.login" }} />
                  <ToolOutput errorText={undefined} output={undefined} />
                </ToolContent>
              </Tool>
              <Tool defaultOpen>
                <ToolHeader state="output-error" type="tool-scan_middleware" />
                <ToolContent>
                  <ToolInput input={{ depth: 3 }} />
                  <ToolOutput errorText="Timed out after 30s" output={undefined} />
                </ToolContent>
              </Tool>
            </div>
          </Section>

          {/* Message thread */}
          <Section title="Conversation + Message" hint="thread, streaming-markdown response">
            <Conversation className="h-[320px] rounded-md border border-border">
              <ConversationContent>
                <Message from="user">
                  <MessageContent>How does auth work in this repo?</MessageContent>
                </Message>
                <Message from="assistant">
                  <MessageContent>
                    <MessageResponse>{RESPONSE_MD}</MessageResponse>
                  </MessageContent>
                </Message>
                <Message from="user">
                  <MessageContent>Where is the token actually checked?</MessageContent>
                </Message>
                <Message from="assistant">
                  <MessageContent>In the <code>require_auth</code> middleware.</MessageContent>
                </Message>
              </ConversationContent>
            </Conversation>
          </Section>

          {/* Prompt input */}
          <Section title="PromptInput — input bar" hint="standalone; onSubmit local">
            <PromptInput
              onSubmit={(_message, event) => {
                event.preventDefault()
                setSubmittedAt(new Date().toLocaleTimeString())
              }}
            >
              <PromptInputTextarea placeholder="Ask about the repo... (demo, not wired)" />
              <PromptInputFooter>
                <PromptInputTools />
                <PromptInputSubmit />
              </PromptInputFooter>
            </PromptInput>
            {submittedAt && (
              <div className="mt-2 text-muted-foreground text-xs">Submitted at {submittedAt} (no backend call)</div>
            )}
          </Section>

          {/* Suggestions */}
          <Section title="Suggestion" hint="standalone">
            <Suggestions>
              {["Explain the auth flow", "Where are routes registered?", "Find the DB layer", "Trace a request"].map(
                (s) => (
                  <Suggestion key={s} onClick={(val) => setPicked(val)} suggestion={s} />
                ),
              )}
            </Suggestions>
            {picked && <div className="mt-2 text-muted-foreground text-xs">Picked: {picked}</div>}
          </Section>

          {/* Reasoning */}
          <Section title="Reasoning" hint="standalone; markdown content">
            <Reasoning defaultOpen>
              <ReasoningTrigger />
              <ReasoningContent>{REASONING_MD}</ReasoningContent>
            </Reasoning>
          </Section>

          {/* Chain of thought */}
          <Section title="ChainOfThought" hint="standalone">
            <ChainOfThought defaultOpen>
              <ChainOfThoughtHeader>How I mapped the auth flow</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                <ChainOfThoughtStep
                  description="app.py, 12 rules"
                  icon={SearchIcon}
                  label="Located route registration"
                  status="complete"
                />
                <ChainOfThoughtStep
                  description="auth.login -> handlers/auth.py"
                  icon={GitBranchIcon}
                  label="Followed route to handler"
                  status="complete"
                />
                <ChainOfThoughtStep
                  icon={FileCodeIcon}
                  label="Scanning middleware for token check"
                  status="active"
                />
              </ChainOfThoughtContent>
            </ChainOfThought>
          </Section>

          {/* Task */}
          <Section title="Task" hint="standalone">
            <Task defaultOpen>
              <TaskTrigger title="Explored repo structure" />
              <TaskContent>
                <TaskItem>Indexed 214 files across 18 directories</TaskItem>
                <TaskItem>
                  Entry point <TaskItemFile>app.py</TaskItemFile>
                </TaskItem>
                <TaskItem>
                  Handlers in <TaskItemFile>handlers/</TaskItemFile>
                </TaskItem>
              </TaskContent>
            </Task>
          </Section>

          {/* Code block */}
          <Section title="CodeBlock" hint="standalone; Shiki github-light/dark">
            <CodeBlock code={PY_SAMPLE} language="python" showLineNumbers />
          </Section>

          {/* Shimmer / loader */}
          <Section title="Shimmer — loader" hint="standalone">
            <Shimmer>Recalling skills from prior repos...</Shimmer>
          </Section>

          {/* Charts span full width */}
          <Section title="Chart — skill activity (area)" hint="shadcn chart, token-mapped">
            <SkillActivityAreaChart />
          </Section>
          <Section title="Chart — skill usage per repo (bar)" hint="shadcn chart, token-mapped">
            <SkillUsageBarChart />
          </Section>
          <Section title="Chart — recall outcomes (donut)" hint="shadcn chart, token-mapped">
            <SkillOutcomeDonutChart />
          </Section>
        </div>
      </div>
    </TooltipProvider>
  )
}
