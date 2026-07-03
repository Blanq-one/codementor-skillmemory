import { AnimatePresence, motion } from "motion/react"
import { HudLabel, RECALL_STATE } from "./ui"
import { RECALLED_SKILLS, type RecalledSkill } from "./session"

/**
 * THE SIGNATURE. Most chat products hide retrieval; this exposes it. Each
 * recalled skill "surfaces" from memory with a scan-in as the agent works,
 * labeled with the repo it was learned on and whether it transferred.
 * (Kept as motion.li directly rather than <Surface> because it needs to be an
 * animated list item; still uses the shared sk-glass treatment + primitives.)
 */
function RecallCard({ skill, index }: { skill: RecalledSkill; index: number }) {
  const meta = RECALL_STATE[skill.state]
  const ignored = skill.state === "ignored"

  return (
    <motion.li
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg sk-glass p-3"
      initial={{ opacity: 0, y: 14 }}
      style={{ boxShadow: skill.state === "used" ? "var(--sk-glow-recall)" : undefined }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* scan-in sweep */}
      <motion.div
        animate={{ x: "130%" }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
        initial={{ x: "-130%" }}
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${meta.color} 22%, transparent), transparent)` }}
        transition={{ duration: 0.9, delay: 0.1, ease: "easeInOut" }}
      />

      <div className="mb-2 flex items-center justify-between gap-2">
        <HudLabel tone={meta.color}>
          {String(index + 1).padStart(2, "0")} · {meta.label}
        </HudLabel>
        <span className="sk-mono text-[10px] text-muted-foreground">{Math.round(skill.confidence * 100)}%</span>
      </div>

      <p
        className={`m-0 text-[13px] leading-snug ${ignored ? "text-muted-foreground line-through decoration-[color-mix(in_srgb,var(--accent-danger)_60%,transparent)]" : "text-foreground"}`}
      >
        {skill.method}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        <svg aria-hidden className="size-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          <path d="M6 3v12a3 3 0 0 0 3 3h9M18 15l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sk-mono text-[11px] text-muted-foreground">{skill.sourceRepo}</span>
      </div>

      {skill.note && (
        <p className="mt-2 border-border border-t pt-2 text-[11px] text-muted-foreground leading-relaxed">
          {skill.note}
        </p>
      )}

      {/* confidence spine */}
      <div className="mt-2 h-px w-full bg-border">
        <motion.div
          animate={{ scaleX: skill.confidence }}
          className="h-px origin-left"
          initial={{ scaleX: 0 }}
          style={{ background: meta.color }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        />
      </div>
    </motion.li>
  )
}

export function RecallRail({ revealed }: { revealed: number }) {
  const shown = RECALLED_SKILLS.slice(0, revealed)

  return (
    <aside className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between">
        <HudLabel>Recall · this query</HudLabel>
        <span className="sk-mono text-[11px] text-muted-foreground">
          {revealed}/{RECALLED_SKILLS.length}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        <AnimatePresence>
          {shown.map((skill, i) => (
            <RecallCard index={i} key={skill.id} skill={skill} />
          ))}
        </AnimatePresence>
        {revealed === 0 && (
          <li className="sk-label rounded-lg border border-border border-dashed p-3 text-center">
            searching memory...
          </li>
        )}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        Skills carried in from {RECALLED_SKILLS.length} prior repos. Cyan applied cleanly,
        amber needed adapting, struck-through didn&apos;t transfer.
      </p>
    </aside>
  )
}
