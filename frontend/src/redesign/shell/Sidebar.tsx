import type { LucideIcon } from "lucide-react"
import { MessagesSquareIcon, ActivityIcon, NetworkIcon, FolderGitIcon, SettingsIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BrandMark } from "../ui"

export type NavId = "chat" | "dashboard" | "skills" | "repos"

const NAV: Array<{ id: NavId; label: string; icon: LucideIcon }> = [
  { id: "chat", label: "Agent chat", icon: MessagesSquareIcon },
  { id: "dashboard", label: "Telemetry", icon: ActivityIcon },
  { id: "skills", label: "Skill library", icon: NetworkIcon },
  { id: "repos", label: "Repositories", icon: FolderGitIcon },
]

function RailButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex size-11 items-center justify-center rounded-lg transition-colors",
            active ? "text-[var(--accent-recall)]" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={onClick}
          type="button"
        >
          {active && (
            <span className="-translate-y-1/2 absolute top-1/2 left-0 h-5 w-0.5 rounded-full bg-[var(--accent-recall)] shadow-[var(--sk-glow-recall)]" />
          )}
          <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className="sk-mono text-xs">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

/** Slim vertical rail: brand, primary nav (icon + hover flyout), settings +
 *  session at the foot. Deliberately not a ChatGPT-style label sidebar. */
export function Sidebar({ active = "chat", onNavigate }: { active?: NavId; onNavigate?: (id: NavId) => void }) {
  return (
    <nav className="sk-glass sticky top-0 flex h-screen w-[64px] flex-col items-center gap-1 py-3">
      <BrandMark size={26} />
      <span className="my-2 h-px w-7 bg-border" />

      {NAV.map((item) => (
        <RailButton
          active={active === item.id}
          icon={item.icon}
          key={item.id}
          label={item.label}
          onClick={() => onNavigate?.(item.id)}
        />
      ))}

      <div className="mt-auto flex flex-col items-center gap-2">
        <RailButton icon={SettingsIcon} label="Settings" />
        <span
          className="flex size-7 items-center justify-center rounded-full border border-border sk-mono text-[10px] text-muted-foreground"
          title="session"
        >
          KN
        </span>
      </div>
    </nav>
  )
}
