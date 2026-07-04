import { useEffect, useState, type ReactNode } from "react"
import { fetchRepos, repoLabel } from "@/api/client"
import { AppShell } from "./shell/AppShell"
import { ShellTopBar } from "./shell/ShellTopBar"
import type { NavId } from "./shell/Sidebar"
import { ChatPanel } from "./panels/ChatPanel"
import { LiveChatPanel } from "./panels/LiveChatPanel"
import { DashboardPanel } from "./panels/DashboardPanel"
import { Placeholder } from "./panels/Placeholder"
import { Chip, GlowDot, HudLabel } from "./ui"
import { SESSION } from "./session"

function LiveIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
      <GlowDot pulse />
      <HudLabel>{label}</HudLabel>
    </span>
  )
}

/**
 * The redesigned app: one AppShell, sidebar-driven in-app navigation between
 * the chat and dashboard (skills/repos are stubs). Each view supplies its own
 * ShellTopBar title + context. Nothing is wired to a backend yet.
 */
export function RedesignApp({ initial = "chat", live = false }: { initial?: NavId; live?: boolean }) {
  const [active, setActive] = useState<NavId>(initial)

  // Repo list is only needed (and only fetched) in live mode; shared between
  // the top bar and the live chat panel so they show the same real repo.
  const [repos, setRepos] = useState<string[]>([])
  const [repo, setRepo] = useState("")
  const [reposLoaded, setReposLoaded] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  useEffect(() => {
    if (!live) return
    // Cancel-flag pattern (not AbortController): React 18 StrictMode runs the
    // effect twice in dev and fires cleanup between; aborting there cancels the
    // request and, with a silent catch, left the list stuck empty. Here we
    // simply ignore a stale resolution and surface real errors instead.
    let cancelled = false
    setReposLoaded(false)
    setReposError(null)
    fetchRepos()
      .then((rs) => {
        if (cancelled) return
        setRepos(rs)
        setRepo((prev) => prev || rs[0] || "")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setReposError(err instanceof Error ? err.message : "Could not load repositories")
        console.error("[SkillMemory] /repos fetch failed:", err)
      })
      .finally(() => {
        if (!cancelled) setReposLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [live])

  const repoChipText = reposError
    ? "api unreachable"
    : reposLoaded
      ? repo
        ? repoLabel(repo)
        : "none ingested"
      : "loading…"

  let topBar: ReactNode
  let content: ReactNode

  switch (active) {
    case "chat":
      topBar = (
        <ShellTopBar
          context={
            <>
              <Chip className="hidden md:inline-flex" label="repo">
                {live ? repoChipText : SESSION.targetRepo}
              </Chip>
              <LiveIndicator label="recalling" />
            </>
          }
          eyebrow={live ? "session · live" : `session · ${SESSION.id}`}
          title="Agent chat"
        />
      )
      content = live ? (
        <LiveChatPanel repo={repo} reposError={reposError} reposLoaded={reposLoaded} repos={repos} />
      ) : (
        <ChatPanel />
      )
      break
    case "dashboard":
      topBar = (
        <ShellTopBar
          context={
            <>
              <Chip className="hidden md:inline-flex" label="window">
                last 30d
              </Chip>
              <LiveIndicator label="live" />
            </>
          }
          eyebrow="workspace · telemetry"
          title="Telemetry"
        />
      )
      content = <DashboardPanel />
      break
    case "skills":
      topBar = <ShellTopBar eyebrow="workspace · skills" title="Skill library" />
      content = <Placeholder note="The cross-repo skill graph view lands here." title="Skill library — in progress" />
      break
    default:
      topBar = <ShellTopBar eyebrow="workspace · repos" title="Repositories" />
      content = <Placeholder note="Ingested repositories and their status land here." title="Repositories — in progress" />
  }

  return (
    <AppShell active={active} onNavigate={setActive} topBar={topBar}>
      {content}
    </AppShell>
  )
}

export default RedesignApp
