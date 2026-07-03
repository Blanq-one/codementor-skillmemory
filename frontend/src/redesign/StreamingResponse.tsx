import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { MessageResponse } from "@/components/ai-elements/message"

/**
 * Reveals a markdown string as if it were streaming from the model, feeding a
 * growing substring to Streamdown (which is built for exactly this). Shows a
 * cyan caret while streaming. Reduced motion → full text immediately, no caret.
 */
export function StreamingResponse({
  text,
  active,
  charsPerTick = 3,
  tickMs = 16,
}: {
  text: string
  active: boolean
  charsPerTick?: number
  tickMs?: number
}) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(() => (active && !reduced ? "" : text))
  const raf = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active || reduced) {
      setShown(text)
      return
    }
    setShown("")
    let i = 0
    raf.current = setInterval(() => {
      i = Math.min(text.length, i + charsPerTick)
      setShown(text.slice(0, i))
      if (i >= text.length && raf.current) {
        clearInterval(raf.current)
        raf.current = null
      }
    }, tickMs)
    return () => {
      if (raf.current) clearInterval(raf.current)
    }
  }, [text, active, reduced, charsPerTick, tickMs])

  const streaming = active && !reduced && shown.length < text.length

  return (
    <div className="sk-prose">
      <MessageResponse>{shown}</MessageResponse>
      {streaming && <span aria-hidden className="sk-caret" />}
    </div>
  )
}
