import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { fetchRepos } from "@/api/client"

/**
 * One shared /repos fetch for both the landing hub and the repo workspace, so
 * they show the same list and a freshly-analyzed repo appears everywhere.
 * Cancel-flag fetch; errors surfaced (never swallowed).
 */
type ReposState = {
  repos: string[]
  reposLoaded: boolean
  reposError: string | null
  refresh: () => void
}

const ReposCtx = createContext<ReposState | null>(null)

export function ReposProvider({ children }: { children: ReactNode }) {
  const [repos, setRepos] = useState<string[]>([])
  const [reposLoaded, setReposLoaded] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    fetchRepos()
      .then((rs) => {
        if (!cancelled) setRepos(rs)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setReposError(err instanceof Error ? err.message : "Could not load repositories")
        console.error("[SkillMemory] /repos fetch failed:", err)
      })
      .finally(() => {
        if (!cancelled) setReposLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return (
    <ReposCtx.Provider value={{ repos, reposLoaded, reposError, refresh }}>{children}</ReposCtx.Provider>
  )
}

export function useRepos(): ReposState {
  const value = useContext(ReposCtx)
  if (!value) throw new Error("useRepos must be used within ReposProvider")
  return value
}
