import { useEffect, useState } from "react"
import { NetworkIcon } from "lucide-react"
import { fetchSkills, repoLabel, type SkillLogItem } from "@/api/client"
import { Surface, Eyebrow, HudLabel, GlowDot, Reveal } from "../ui"

type Status = "loading" | "done" | "error"

function timeAgo(tsSeconds: number): string {
  if (!tsSeconds) return ""
  const diff = Date.now() - tsSeconds * 1000
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(tsSeconds * 1000).toLocaleDateString()
}

function SkillCard({ skill, index }: { skill: SkillLogItem; index: number }) {
  return (
    <Reveal delay={Math.min(index, 8) * 0.03}>
      <Surface className="rounded-[var(--sk-radius-lg)] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <HudLabel tone="var(--accent-recall)">{String(index + 1).padStart(2, "0")} · method</HudLabel>
          <span className="sk-mono text-[10px] text-muted-foreground">{timeAgo(skill.ts)}</span>
        </div>
        <p className="m-0 text-[13px] text-foreground leading-relaxed">{skill.method}</p>
        <div className="mt-3 flex items-center gap-1.5 border-border border-t pt-2">
          <svg aria-hidden className="size-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path d="M6 3v12a3 3 0 0 0 3 3h9M18 15l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <HudLabel>learned from</HudLabel>
          <span className="sk-mono text-[11px] text-muted-foreground">{repoLabel(skill.source_repo)}</span>
        </div>
      </Surface>
    </Reveal>
  )
}

/** The cross-repo skill library: what the librarian has saved, from GET /skills. */
export function SkillLibrary() {
  const [status, setStatus] = useState<Status>("loading")
  const [skills, setSkills] = useState<SkillLogItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSkills()
      .then((s) => {
        if (cancelled) return
        setSkills(s)
        setStatus("done")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Could not load the skill library.")
        setStatus("error")
        console.error("[SkillMemory] /skills fetch failed:", err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NetworkIcon className="size-4 text-[var(--accent-recall)]" />
          <HudLabel>
            {status === "done" ? `${skills.length} learned method${skills.length === 1 ? "" : "s"}` : "skill library"}
          </HudLabel>
        </div>
        {status === "loading" && (
          <span className="inline-flex items-center gap-1.5">
            <GlowDot pulse />
            <HudLabel>loading…</HudLabel>
          </span>
        )}
      </div>

      {status === "error" && (
        <Surface
          className="rounded-[var(--sk-radius-lg)] p-4"
          style={{ borderColor: "color-mix(in srgb, var(--accent-danger) 55%, var(--border-hairline))" }}
        >
          <HudLabel tone="var(--accent-danger)">couldn&apos;t load skills</HudLabel>
          <p className="mt-1 text-[13px] text-muted-foreground">{error}</p>
        </Surface>
      )}

      {status === "done" && skills.length === 0 && (
        <Surface className="rounded-[var(--sk-radius-lg)] p-8 text-center">
          <Eyebrow>Nothing learned yet</Eyebrow>
          <p className="mx-auto m-0 max-w-md text-[13px] text-muted-foreground leading-relaxed">
            Study a repository and ask a few questions. After each answer the librarian distills a
            transferable method and saves it here — then recalls it on the next repo.
          </p>
        </Surface>
      )}

      {status === "done" && skills.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {skills.map((skill, i) => (
            <SkillCard index={i} key={`${skill.ts}-${i}`} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
