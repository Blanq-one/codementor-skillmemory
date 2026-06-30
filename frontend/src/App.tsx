import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { askQuestion, fetchRepos, type AskResult } from './api/client'
import { TopBar } from './components/TopBar'
import { AskPanel } from './components/AskPanel'
import { GraphPane } from './components/GraphPane'

export type Status = 'idle' | 'loading' | 'done' | 'error'

export default function App() {
  const { theme, toggle } = useTheme()

  const [repos, setRepos] = useState<string[]>([])
  const [repo, setRepo] = useState('')
  const [reposLoaded, setReposLoaded] = useState(false)

  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<AskResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [askedQuestion, setAskedQuestion] = useState('')
  const [runId, setRunId] = useState(0) // bumps on each completed ask to retrigger the trace

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchRepos(ctrl.signal)
      .then((rs) => {
        setRepos(rs)
        setRepo((prev) => prev || rs[0] || '')
        setReposLoaded(true)
      })
      .catch(() => setReposLoaded(true))
    return () => ctrl.abort()
  }, [])

  const run = useCallback(
    (question: string) => {
      const q = question.trim()
      if (!repo || !q || status === 'loading') return
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setStatus('loading')
      setError(null)
      setAskedQuestion(q)
      askQuestion(repo, q, ctrl.signal)
        .then((res) => {
          setResult(res)
          setStatus('done')
          setRunId((n) => n + 1)
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return
          setError(err instanceof Error ? err.message : 'Something went wrong.')
          setStatus('error')
        })
    },
    [repo, status],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setStatus(result ? 'done' : 'idle')
  }, [result])

  return (
    <div className="app">
      <TopBar
        theme={theme}
        onToggleTheme={toggle}
        connected={reposLoaded && repos.length > 0}
      />
      <main className="layout">
        <AskPanel
          repos={repos}
          repo={repo}
          onRepoChange={setRepo}
          status={status}
          result={result}
          error={error}
          onAsk={run}
          onCancel={cancel}
        />
        <GraphPane
          status={status}
          result={result}
          question={askedQuestion}
          runId={runId}
        />
      </main>
    </div>
  )
}
