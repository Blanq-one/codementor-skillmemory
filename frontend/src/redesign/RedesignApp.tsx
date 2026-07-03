import { useState, type ReactNode } from "react"
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

  let topBar: ReactNode
  let content: ReactNode

  switch (active) {
    case "chat":
      topBar = (
        <ShellTopBar
          context={
            <>
              <Chip className="hidden md:inline-flex" label="repo">
                {SESSION.targetRepo}
              </Chip>
              <LiveIndicator label="recalling" />
            </>
          }
          eyebrow={live ? "session · live" : `session · ${SESSION.id}`}
          title="Agent chat"
        />
      )
      content = live ? <LiveChatPanel /> : <ChatPanel />
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
