import { lazy, Suspense, useState } from "react"
import { ArrowRightIcon, NetworkIcon, FolderGitIcon } from "lucide-react"

import "./../styles/redesign.css"
import { analyzeRepo, repoLabel } from "@/api/client"
import { Surface, HudLabel, Eyebrow, BrandMark, GlowDot, ScanLine, Reveal, ThemeToggle } from "./ui"
import { Shimmer } from "@/components/ai-elements/shimmer"

const AmbientGraph = lazy(() => import("./AmbientGraph"))

const ANALYZE_TIMEOUT_MS = 5 * 60 * 1000

/** owner/repo from a git URL, for display. */
function prettyRepo(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "")
    return path || url
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\.git$/, "")
  }
}

function StudyBox({ onOpenRepo }: { onOpenRepo: (id: string, opts?: { justAnalyzed?: boolean }) => void }) {
  const [url, setUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "analyzing" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState("")

  const study = () => {
    const u = url.trim()
    if (!u || phase === "analyzing") return
    setTarget(prettyRepo(u))
    setPhase("analyzing")
    setError(null)

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ANALYZE_TIMEOUT_MS)
    analyzeRepo(u, ctrl.signal)
      .then((res) => {
        clearTimeout(timer)
        onOpenRepo(res.repository_id, { justAnalyzed: true })
      })
      .catch((err: unknown) => {
        clearTimeout(timer)
        const msg = ctrl.signal.aborted
          ? "Analysis timed out after 5 minutes — the repo may be very large, or the backend is stuck. Check the server logs."
          : err instanceof Error
            ? err.message
            : "Analysis failed."
        setError(msg)
        setPhase("error")
        console.error("[SkillMemory] /analyze-repo failed:", err)
      })
  }

  if (phase === "analyzing") {
    return (
      <Surface className="relative overflow-hidden rounded-[var(--sk-radius-lg)] p-5" glow="soft">
        <ScanLine />
        <div className="flex items-center gap-2">
          <GlowDot pulse />
          <Shimmer>{`Analyzing ${target}…`}</Shimmer>
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
          Cloning, parsing, and building the dependency graph. This can take a few minutes for a large
          repo. Indexing then continues in the background — you can start asking as soon as it opens,
          though early answers may be incomplete.
        </p>
      </Surface>
    )
  }

  return (
    <Surface className="sk-focus rounded-[var(--sk-radius-lg)] p-2 transition-shadow" variant="strong">
      <div className="flex items-center gap-2">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") study()
          }}
          placeholder="https://github.com/owner/repo"
          spellCheck={false}
          value={url}
        />
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--accent-recall)] px-3.5 py-2.5 font-medium text-[13px] text-[var(--bg-base)] transition-opacity hover:opacity-90 disabled:opacity-40"
          disabled={!url.trim()}
          onClick={study}
          type="button"
        >
          Study repo
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
      {phase === "error" && error && (
        <p className="mt-2 px-1 text-[12px] leading-relaxed" style={{ color: "var(--accent-danger)" }}>
          {error}
        </p>
      )}
    </Surface>
  )
}

function StudiedRepos({
  repos,
  reposLoaded,
  reposError,
  onOpenRepo,
}: {
  repos: string[]
  reposLoaded: boolean
  reposError?: string | null
  onOpenRepo: (id: string) => void
}) {
  return (
    <Surface className="rounded-[var(--sk-radius-lg)] p-4">
      <Eyebrow>Studied repositories</Eyebrow>
      {reposError ? (
        <p className="m-0 text-[12px] leading-relaxed" style={{ color: "var(--accent-danger)" }}>
          Couldn&apos;t load /repos: {reposError}
        </p>
      ) : !reposLoaded ? (
        <HudLabel>loading…</HudLabel>
      ) : repos.length === 0 ? (
        <p className="m-0 text-[12px] text-muted-foreground leading-relaxed">
          None yet. Study a repository to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {repos.map((id) => (
            <li key={id}>
              <button
                className="group flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-[color-mix(in_srgb,var(--accent-recall)_45%,var(--border-hairline))]"
                onClick={() => onOpenRepo(id)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <FolderGitIcon className="size-4 text-muted-foreground" />
                  <span className="sk-mono text-[12px] text-foreground">{repoLabel(id)}</span>
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}

/**
 * The front door: study a new repo, browse studied ones, or open the skill
 * library. Full-bleed landing (no shell); entering a repo drops into the chat.
 */
export function EntryPage({
  repos,
  reposLoaded,
  reposError,
  onOpenRepo,
  onOpenSkills,
}: {
  repos: string[]
  reposLoaded: boolean
  reposError?: string | null
  onOpenRepo: (id: string, opts?: { justAnalyzed?: boolean }) => void
  onOpenSkills: () => void
}) {
  return (
    <div className="sk-app relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Suspense fallback={null}>
          <AmbientGraph />
        </Suspense>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1120px] flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={26} />
            <div className="flex items-baseline gap-2">
              <span className="sk-display font-bold text-[15px]">SkillMemory</span>
              <HudLabel className="hidden sm:inline">agent · code intelligence</HudLabel>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="grid flex-1 grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[1.35fr_1fr]">
          {/* Hero + study */}
          <div>
            <Reveal>
              <HudLabel className="block">cross-repo skill memory</HudLabel>
              <h1 className="sk-display mt-3 mb-0 max-w-[15ch] font-bold text-[clamp(2rem,4vw,3.1rem)] leading-[1.05] tracking-[-0.02em]">
                The agent that remembers how to read code.
              </h1>
              <p className="mt-4 max-w-[46ch] text-[15px] text-muted-foreground leading-relaxed">
                Study a repository and the agent learns transferable methods for navigating it — then
                recalls and adapts them on the next repo it has never seen.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mt-6">
                <StudyBox onOpenRepo={onOpenRepo} />
                <HudLabel className="mt-2 block px-1">paste a public git URL · ingest runs on your backend</HudLabel>
              </div>
            </Reveal>
          </div>

          {/* Rail: browse + skill library */}
          <div className="flex flex-col gap-4">
            <Reveal delay={0.12}>
              <StudiedRepos
                onOpenRepo={onOpenRepo}
                repos={repos}
                reposError={reposError}
                reposLoaded={reposLoaded}
              />
            </Reveal>

            <Reveal delay={0.16}>
              <button className="w-full text-left" onClick={onOpenSkills} type="button">
                <Surface className="group rounded-[var(--sk-radius-lg)] p-4 transition-shadow hover:shadow-[var(--sk-glow-soft)]">
                  <div className="flex items-center justify-between">
                    <Eyebrow>Skill library</Eyebrow>
                    <NetworkIcon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="m-0 text-[13px] text-muted-foreground leading-relaxed">
                    Everything the librarian has learned across repos — the methods that transfer.
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--accent-recall)]">
                    Open library
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Surface>
              </button>
            </Reveal>
          </div>
        </main>
      </div>
    </div>
  )
}
