import { lazy, Suspense } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"

import { AppShell } from "./shell/AppShell"
import { ShellTopBar } from "./shell/ShellTopBar"
import type { NavId } from "./shell/Sidebar"
import { RepoPicker } from "./RepoPicker"
import { GlowDot, HudLabel } from "./ui"
import { useRepos } from "./repos-context"

// Heavy panels are code-split so the landing chunk stays light.
const LiveChatPanel = lazy(() => import("./panels/LiveChatPanel").then((m) => ({ default: m.LiveChatPanel })))
const DashboardPanel = lazy(() => import("./panels/DashboardPanel").then((m) => ({ default: m.DashboardPanel })))
const SkillLibrary = lazy(() => import("./panels/SkillLibrary").then((m) => ({ default: m.SkillLibrary })))

const SEG_TO_NAV: Record<string, NavId> = { chat: "chat", telemetry: "dashboard", skills: "skills" }
const META: Record<string, { title: string; eyebrow: string }> = {
  chat: { title: "Agent chat", eyebrow: "session · live" },
  telemetry: { title: "Telemetry", eyebrow: "workspace · telemetry" },
  skills: { title: "Skill library", eyebrow: "workspace · memory" },
}

/**
 * Route "/repo/:repoId/*" — the workspace for one repo. Real sub-routes
 * (chat / telemetry / skills) so browser back/forward/refresh behave. The
 * sidebar, brand (home), and repo picker all drive navigation via the URL.
 */
export function Workspace() {
  const { repoId = "" } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { repos, reposLoaded, reposError } = useRepos()

  const seg = location.pathname.split("/")[3] || "chat" // /repo/:id/<seg>
  const view = seg in META ? seg : "chat"
  const active = SEG_TO_NAV[view] ?? "chat"

  const onNavigate = (id: NavId) => {
    if (id === "repos") navigate("/") // Repositories -> landing/repo-list
    else if (id === "dashboard") navigate(`/repo/${repoId}/telemetry`)
    else if (id === "skills") navigate(`/repo/${repoId}/skills`)
    else navigate(`/repo/${repoId}/chat`)
  }
  const goHome = () => navigate("/")
  const selectRepo = (id: string) => navigate(`/repo/${id}/${view}`) // switch repo, keep sub-view

  const justAnalyzed = (location.state as { justAnalyzed?: boolean } | null)?.justAnalyzed
  const notice = justAnalyzed
    ? "Indexing this repo in the background — early answers may be incomplete."
    : null

  const meta = META[view]
  const topBar = (
    <ShellTopBar
      context={
        <>
          <RepoPicker
            onChange={selectRepo}
            reposError={reposError}
            reposLoaded={reposLoaded}
            repos={repos}
            value={repoId}
          />
          {view === "chat" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
              <GlowDot pulse />
              <HudLabel>recalling</HudLabel>
            </span>
          )}
        </>
      }
      eyebrow={meta.eyebrow}
      title={meta.title}
    />
  )

  return (
    <AppShell active={active} onHome={goHome} onNavigate={onNavigate} topBar={topBar}>
      <Suspense fallback={<div className="p-6"><HudLabel>loading…</HudLabel></div>}>
        <Routes>
          <Route element={<Navigate replace to="chat" />} index />
          <Route
            element={
              <LiveChatPanel
                key={repoId}
                notice={notice}
                repo={repoId}
                reposError={reposError}
                reposLoaded={reposLoaded}
                repos={repos}
              />
            }
            path="chat"
          />
          <Route element={<DashboardPanel />} path="telemetry" />
          <Route element={<SkillLibrary />} path="skills" />
          <Route element={<Navigate replace to="chat" />} path="*" />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
