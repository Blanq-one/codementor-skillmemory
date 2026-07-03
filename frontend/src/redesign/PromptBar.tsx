import { useState } from "react"
import { motion } from "motion/react"
import type { ChatStatus } from "ai"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { Surface, HudLabel } from "./ui"
import { SESSION } from "./session"

/**
 * Premium prompt bar: glassy, cyan focus glow, mono context chips.
 * - Scripted mode (no `onSubmit`): submit just flashes an acknowledgement.
 * - Live mode (`onSubmit` provided): forwards the trimmed text; `status`
 *   reflects the in-flight request so the submit button shows a spinner.
 */
export function PromptBar({
  onSubmit,
  status,
  placeholder = "Ask about acme/payments-api — the agent will recall what it learned elsewhere",
}: {
  onSubmit?: (text: string) => void
  status?: ChatStatus
  placeholder?: string
} = {}) {
  const [sentAt, setSentAt] = useState<string | null>(null)
  const busy = status === "submitted" || status === "streaming"

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Surface
        className="sk-focus rounded-[var(--sk-radius-lg)] px-2 pt-1 pb-2 transition-shadow"
        variant="strong"
      >
        <PromptInput
          onSubmit={(m, e) => {
            e.preventDefault()
            const text = (m.text ?? "").trim()
            if (onSubmit) {
              if (text && !busy) onSubmit(text)
            } else {
              setSentAt(new Date().toLocaleTimeString())
            }
          }}
        >
          <PromptInputTextarea className="bg-transparent" placeholder={placeholder} />
          <PromptInputFooter className="border-0">
            <PromptInputTools>
              <HudLabel className="rounded border border-border px-2 py-1">{SESSION.stack}</HudLabel>
              <HudLabel className="rounded border border-border px-2 py-1">
                memory · {SESSION.reposSeen} repos
              </HudLabel>
            </PromptInputTools>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </Surface>
      <div className="mt-2 flex items-center justify-between px-1">
        <HudLabel>
          {onSubmit
            ? busy
              ? "working — the agent is recalling and reasoning"
              : "enter to send · shift+enter for newline"
            : sentAt
              ? `sent ${sentAt} · not wired to backend`
              : "enter to send · shift+enter for newline"}
        </HudLabel>
        <span className="sk-mono text-[10px] text-muted-foreground">{SESSION.id}</span>
      </div>
    </motion.div>
  )
}
