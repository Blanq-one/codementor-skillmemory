import { memo } from "react"
import { motion, useReducedMotion } from "motion/react"

/**
 * Ambient backdrop: a sparse skill-memory graph that drifts slowly, with one
 * cyan pulse traveling an edge (a skill being recalled). Purely decorative,
 * pointer-events off, very low opacity. Lazy-loaded by ChatView so it never
 * touches first paint. Static under prefers-reduced-motion.
 */

// Normalized coordinates in a 100x62 field.
const NODES: Array<[number, number, number]> = [
  [12, 14, 1.6], [28, 30, 1.1], [20, 48, 1.3], [40, 12, 1.0], [46, 40, 1.8],
  [58, 22, 1.2], [66, 50, 1.1], [74, 16, 1.4], [82, 38, 1.0], [90, 26, 1.5],
  [52, 56, 1.0],
]
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [1, 4], [3, 4], [4, 5], [5, 7], [5, 6], [7, 8], [8, 9], [6, 10], [4, 10], [3, 5],
]
// Edge the recall-pulse travels along.
const PULSE: [number, number] = [1, 4]

function AmbientGraphBase() {
  const reduced = useReducedMotion()
  const [a, b] = PULSE
  // Guard against a bad index so cx/cy are always numeric (never undefined).
  const pa = NODES[a] ?? [0, 0, 1]
  const pb = NODES[b] ?? [0, 0, 1]

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.4 }}
      viewBox="0 0 100 62"
    >
      <motion.g
        animate={reduced ? undefined : { x: [0, -1.5, 0], y: [0, 1, 0] }}
        transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
      >
        {EDGES.map(([i, j], k) => (
          <line
            key={k}
            stroke="var(--border-hairline)"
            strokeWidth={0.15}
            x1={NODES[i][0]}
            x2={NODES[j][0]}
            y1={NODES[i][1]}
            y2={NODES[j][1]}
          />
        ))}

        {NODES.map(([x, y, r], k) => (
          <motion.circle
            key={k}
            animate={reduced ? undefined : { opacity: [0.35, 0.7, 0.35] }}
            cx={x}
            cy={y}
            fill="var(--text-muted)"
            r={r * 0.5}
            transition={reduced ? undefined : { duration: 4 + (k % 3), repeat: Infinity, ease: "easeInOut", delay: k * 0.4 }}
          />
        ))}

        {/* Recall pulse: a cyan node + a dot traveling the highlighted edge */}
        <line
          stroke="var(--accent-recall)"
          strokeWidth={0.25}
          x1={pa[0]}
          x2={pb[0]}
          y1={pa[1]}
          y2={pb[1]}
          style={{ opacity: 0.5 }}
        />
        {!reduced && (
          <motion.circle
            animate={{ cx: [pa[0], pb[0]], cy: [pa[1], pb[1]], opacity: [0, 1, 0] }}
            cx={pa[0]}
            cy={pa[1]}
            fill="var(--accent-recall)"
            initial={{ cx: pa[0], cy: pa[1], opacity: 0 }}
            r={0.9}
            style={{ filter: "drop-shadow(0 0 2px var(--accent-recall))" }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
          />
        )}
      </motion.g>
    </svg>
  )
}

export const AmbientGraph = memo(AmbientGraphBase)
export default AmbientGraph
