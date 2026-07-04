/**
 * Render-safety seatbelt for Mermaid. Passed to Streamdown as
 * `mermaid={{ errorComponent }}`: whenever Streamdown's mermaid pipeline fails
 * to parse/render a diagram, it calls this instead of its default red error
 * box. We downgrade to the raw diagram source shown as plain code — never a
 * broken error box on screen. (Always-valid generation is the primary defense;
 * this is the seatbelt.)
 */
export function MermaidCodeFallback({ chart }: { chart: string; error?: string; retry?: () => void }) {
  return (
    <pre className="overflow-auto rounded-md border border-border bg-[color-mix(in_srgb,var(--bg-raised)_60%,transparent)] p-3">
      <code className="sk-mono text-muted-foreground text-xs">{chart}</code>
    </pre>
  )
}
