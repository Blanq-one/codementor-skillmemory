import type { RecallState } from "../session"

/** How a recalled skill's transfer outcome maps to color + label. Shared so the
 *  rail, dashboard, and any future skill view stay consistent. */
export const RECALL_STATE: Record<RecallState, { label: string; color: string }> = {
  used: { label: "applied", color: "var(--accent-recall)" },
  adapted: { label: "adapted", color: "var(--accent-ignored)" },
  ignored: { label: "not transferable", color: "var(--text-muted)" },
}
