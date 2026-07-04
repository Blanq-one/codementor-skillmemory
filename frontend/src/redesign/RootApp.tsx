import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react"
import { MotionConfig } from "motion/react"

import { fetchRepos, repoLabel } from "@/api/client"
import { AppShell } from "./shell/AppShell"
import { ShellTopBar } from "./shell/ShellTopBar"
import type { NavId } from "./shell/Sidebar"
import { EntryPage } from "./EntryPage"
import { Placeholder } from "./panels/Placeholder"
import { Chip, GlowDot, HudLabel } from "./ui"

// Heavy panels (chat pulls in streamdown/shiki) are code-split so the "/" entry
// page stays light; they load when you enter that view.
const LiveChatPanel = lazy(() =>
  import("./panels/LiveChatPanel").then((m) => ({ default: m.LiveChatPanel })),
)
const DashboardPanel = lazy(() =>
  import("./panels/DashboardPanel").then((m) => ({ default: m.DashboardPanel })),
)

type View = "entry" | NavId

function LiveIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
      <GlowDot pulse />
      <HudLabel>{label}</HudLabel>
    </span>
  )
}

/**
 * Production root. Front door at "/" is the entry hub; selecting/adding a repo
 * drops into the live chat inside the AppShell. Sidebar navigates; the brand
 * returns home. Repo list is real (from /repos), fetched with the cancel-flag
 * pattern and visible errors. The scripted mock lives on the /_* dev routes.
 */
export function RootApp() {
  const [view, setView] = useState<View>("entry")
  const [repo, setRepo] = useState("")
  const [repos, setRepos] = useState<string[]>([])
  const [reposLoaded, setReposLoaded] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadRepos = useCallback(() => {
    let cancelled = false
    setReposError(null)
    fetchRepos()
      .then((rs) => {
        if (!cancelled) setRepos(rs)
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
  }, [])

  useEffect(() => loadRepos(), [loadRepos])

  const openRepo = (id: string, opts?: { justAnalyzed?: boolean }) => {
    setRepo(id)
    setNotice(opts?.justAnalyzed ? "Indexing this repo in the background — early answers may be incomplete." : null)
    setView("chat")
    loadRepos() // a freshly analyzed repo should show up in browse
  }

  const navigate = (id: NavId) => {
    setNotice(null)
    setView(id)
  }

  if (view === "entry") {
    return (
      <MotionConfig reducedMotion="user">
        <EntryPage
          onOpenRepo={openRepo}
          onOpenSkills={() => setView("skills")}
          repos={repos}
          reposError={reposError}
          reposLoaded={reposLoaded}
        />
      </MotionConfig>
    )
  }

  const chatRepo = repo || repos[0] || ""
  let topBar: ReactNode
  let content: ReactNode

  switch (view) {
    case "chat":
      topBar = (
        <ShellTopBar
          context={
            <>
              <Chip className="hidden md:inline-flex" label="repo">
                {reposError ? "api unreachable" : chatRepo ? repoLabel(chatRepo) : "none"}
              </Chip>
              <LiveIndicator label="recalling" />
            </>
          }
          eyebrow="session · live"
          title="Agent chat"
        />
      )
      content = (
        <LiveChatPanel
          notice={notice}
          repo={chatRepo}
          reposError={reposError}
          reposLoaded={reposLoaded}
          repos={repos}
        />
      )
      break
    case "dashboard":
      topBar = (
        <ShellTopBar context={<LiveIndicator label="live" />} eyebrow="workspace · telemetry" title="Telemetry" />
      )
      content = <DashboardPanel />
      break
    case "skills":
      topBar = <ShellTopBar eyebrow="workspace · skills" title="Skill library" />
      content = <Placeholder note="Listing what the librarian has learned — building next." title="Skill library" />
      break
    default:
      topBar = <ShellTopBar eyebrow="workspace · repos" title="Repositories" />
      content = <Placeholder note="Browse studied repos from the home hub for now." title="Repositories" />
  }

  return (
    <AppShell active={view} onHome={() => setView("entry")} onNavigate={navigate} topBar={topBar}>
      <Suspense fallback={<div className="p-6"><HudLabel>loading…</HudLabel></div>}>{content}</Suspense>
    </AppShell>
  )
}

export default RootApp
