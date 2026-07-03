import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/** A cyan line that sweeps top→bottom of its (overflow-hidden) parent to signal
 *  live/streaming work. Used on running tool cards and live telemetry panels. */
export function ScanLine({ className, duration = 1.2 }: { className?: string; duration?: number }) {
  return (
    <motion.div
      animate={{ top: ["0%", "100%"] }}
      className={cn("sk-scanline", className)}
      style={{ top: 0 }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}
