import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { repoLabel } from "@/api/client"
import { HudLabel } from "./ui"

/**
 * Active-repo picker for the chat top bar. Lists the real repos from /repos,
 * marks the current one, and switching re-scopes the chat + Recall Rail
 * immediately (RootApp keys the panel on the repo). Errors are surfaced.
 */
export function RepoPicker({
  repos,
  value,
  onChange,
  reposLoaded,
  reposError,
}: {
  repos: string[]
  value: string
  onChange: (id: string) => void
  reposLoaded: boolean
  reposError?: string | null
}) {
  if (reposError) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5" style={{ borderColor: "color-mix(in srgb, var(--accent-danger) 55%, var(--border-hairline))" }}>
        <HudLabel tone="var(--accent-danger)">api unreachable</HudLabel>
      </span>
    )
  }

  if (!reposLoaded) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
        <HudLabel>loading repos…</HudLabel>
      </span>
    )
  }

  if (repos.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
        <HudLabel>no repos ingested</HudLabel>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <HudLabel>repo</HudLabel>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger
          aria-label="Active repository"
          className="h-8 gap-1.5 rounded-md border-border bg-transparent px-2.5 sk-mono text-[12px] text-foreground"
        >
          <SelectValue placeholder="select repo" />
        </SelectTrigger>
        <SelectContent className="sk-glass">
          {repos.map((id) => (
            <SelectItem className="sk-mono text-[12px]" key={id} value={id}>
              {repoLabel(id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
