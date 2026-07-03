import { Surface, Eyebrow } from "../ui"

/** Stub for nav destinations not built yet (Skill library, Repositories). */
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Surface className="max-w-md rounded-[var(--sk-radius-lg)] p-6 text-center">
        <Eyebrow>{title}</Eyebrow>
        <p className="m-0 text-muted-foreground text-sm">{note}</p>
      </Surface>
    </div>
  )
}
