import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  MessagesSquareIcon,
  ActivityIcon,
  NetworkIcon,
  FolderGitIcon,
  SettingsIcon,
  PanelLeftIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BrandMark, HudLabel } from "../ui"

export type NavId = "chat" | "dashboard" | "skills" | "repos"

const NAV: Array<{ id: NavId; label: string; icon: LucideIcon }> = [
  { id: "chat", label: "Agent chat", icon: MessagesSquareIcon },
  { id: "dashboard", label: "Telemetry", icon: ActivityIcon },
  { id: "skills", label: "Skill library", icon: NetworkIcon },
  { id: "repos", label: "Repositories", icon: FolderGitIcon },
]

const STORAGE = "sk-sidebar-collapsed"

function RailItem({
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active?: boolean
  collapsed: boolean
  onClick?: () => void
}) {
  const button = (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-lg transition-colors",
        collapsed ? "size-11 justify-center" : "h-10 w-full gap-3 px-3",
        active
          ? "text-[var(--accent-recall)]"
          : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--bg-raised)_55%,transparent)] hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {active && (
        <span className="-translate-y-1/2 absolute top-1/2 left-0 h-5 w-0.5 rounded-full bg-[var(--accent-recall)] shadow-[var(--sk-glow-recall)]" />
      )}
      <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span className="sk-display font-medium text-[13px]">{label}</span>}
    </button>
  )

  if (!collapsed) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">
        <span className="sk-mono text-xs">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Labeled vertical rail (default) that collapses to an icon rail. Keeps the
 * instrument feel: glass, hairline, glowing active bar, Inter Tight labels,
 * mono section header. Collapse state persists in localStorage; collapsed items
 * show hover tooltips.
 */
export function Sidebar({
  active = "chat",
  onNavigate,
  onHome,
}: {
  active?: NavId
  onNavigate?: (id: NavId) => void
  onHome?: () => void
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE) === "1"
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, collapsed ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <nav
      className={cn(
        "sk-glass sticky top-0 flex h-screen flex-col gap-1 py-3 transition-[width] duration-200",
        collapsed ? "w-[64px] items-center px-2" : "w-[236px] px-3",
      )}
    >
      {/* Brand — clickable returns to the entry hub */}
      <button
        aria-label="Home"
        className={cn(
          "flex items-center gap-2.5 rounded-lg text-left transition-colors hover:opacity-80",
          collapsed ? "justify-center" : "px-1",
        )}
        onClick={onHome}
        type="button"
      >
        <BrandMark size={26} />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="sk-display font-bold text-[15px]">SkillMemory</span>
            <HudLabel>code intelligence</HudLabel>
          </div>
        )}
      </button>

      <span className={cn("my-2 h-px bg-border", collapsed ? "w-7 self-center" : "w-full")} />
      {!collapsed && <HudLabel className="mb-1 px-1">Workspace</HudLabel>}

      {NAV.map((item) => (
        <RailItem
          active={active === item.id}
          collapsed={collapsed}
          icon={item.icon}
          key={item.id}
          label={item.label}
          onClick={() => onNavigate?.(item.id)}
        />
      ))}

      <div className="mt-auto flex w-full flex-col gap-1">
        <RailItem collapsed={collapsed} icon={SettingsIcon} label="Settings" />

        {/* Session */}
        <div className={cn("flex items-center gap-2.5 py-1.5", collapsed ? "justify-center" : "px-2")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border sk-mono text-[10px] text-muted-foreground">
            SM
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] text-foreground">Local session</span>
              <HudLabel>sesh · 9f2c14</HudLabel>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground",
            collapsed ? "size-11 justify-center" : "h-9 w-full gap-3 px-3",
          )}
          onClick={() => setCollapsed((c) => !c)}
          type="button"
        >
          <PanelLeftIcon className={cn("size-[18px] shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <HudLabel>Collapse</HudLabel>}
        </button>
      </div>
    </nav>
  )
}
