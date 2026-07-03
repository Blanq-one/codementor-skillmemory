/** Shared motion tokens for the redesign. */
export const SK_EASE = [0.22, 1, 0.36, 1] as const

/** Standard entrance: fade + rise. Distances/durations tuned on screen 1. */
export const rise = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: SK_EASE },
}
