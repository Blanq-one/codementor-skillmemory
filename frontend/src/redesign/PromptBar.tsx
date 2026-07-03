import { useState } from "react"
import { motion } from "motion/react"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { SESSION } from "./session"

/**
 * Premium prompt bar: glassy, cyan focus glow, mono context chips. Standalone
 * (no backend) — submit just flashes an acknowledgement.
 */
export function PromptBar() {
  const [sentAt, setSentAt] = useState<string | null>(null)

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sk-glass-strong sk-focus rounded-[var(--sk-radius-lg)] px-2 pt-1 pb-2 transition-shadow">
        <PromptInput
          onSubmit={(_m, e) => {
            e.preventDefault()
            setSentAt(new Date().toLocaleTimeString())
          }}
        >
          <PromptInputTextarea
            className="bg-transparent"
            placeholder="Ask about acme/payments-api — the agent will recall what it learned elsewhere"
          />
          <PromptInputFooter className="border-0">
            <PromptInputTools>
              <span className="sk-label rounded border border-border px-2 py-1">{SESSION.stack}</span>
              <span className="sk-label rounded border border-border px-2 py-1">
                memory · {SESSION.reposSeen} repos
              </span>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="sk-label">
          {sentAt ? `sent ${sentAt} · not wired to backend` : "enter to send · shift+enter for newline"}
        </span>
        <span className="sk-mono text-[10px] text-muted-foreground">{SESSION.id}</span>
      </div>
    </motion.div>
  )
}
