/** The SkillMemory glyph: a cyan core with a soft bloom. Used in the top bar
 *  and sidebar. */
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-[5px] bg-[var(--accent-recall)] opacity-20 blur-[6px]" />
      <span
        className="relative rounded-[3px] bg-[var(--accent-recall)] shadow-[var(--sk-glow-recall)]"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
    </div>
  )
}
