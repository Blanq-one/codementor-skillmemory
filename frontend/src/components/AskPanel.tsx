import { useState, type KeyboardEvent } from 'react'
import { repoLabel, type AskResult } from '../api/client'
import type { Status } from '../App'
import { SkillCard } from './SkillCard'
import { LoadingTreatment } from './LoadingTreatment'

interface Props {
  repos: string[]
  repo: string
  onRepoChange: (id: string) => void
  status: Status
  result: AskResult | null
  error: string | null
  onAsk: (question: string) => void
  onCancel: () => void
}

export function AskPanel({
  repos,
  repo,
  onRepoChange,
  status,
  result,
  error,
  onAsk,
  onCancel,
}: Props) {
  const [question, setQuestion] = useState('')
  const loading = status === 'loading'

  const submit = () => onAsk(question)

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="pane pane--left" aria-label="Ask and recalled skills">
      <div className="pane__head">
        <h2 className="pane__title">Ask</h2>
        <label className="repo">
          <span className="repo__label">repository</span>
          <select
            className="repo__select"
            value={repo}
            onChange={(e) => onRepoChange(e.target.value)}
            disabled={repos.length === 0}
          >
            {repos.length === 0 && <option value="">no repos indexed</option>}
            {repos.map((id) => (
              <option key={id} value={id}>
                {repoLabel(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ask">
        <div className="ask__field">
          <textarea
            className="ask__input"
            placeholder="How is the overall data pipeline organized, from entry point through to output?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Your question"
            spellCheck={false}
          />
          <div className="ask__row">
            <span className="ask__hint">
              <kbd>Enter</kbd> to ask · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
            </span>
            <button
              type="button"
              className="btn"
              onClick={submit}
              disabled={loading || !question.trim() || !repo}
            >
              Ask
            </button>
          </div>
        </div>
      </div>

      <div className="results">
        {status === 'idle' && !result && <IdleState />}

        {loading && <LoadingTreatment onCancel={onCancel} />}

        {error && status === 'error' && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {result && status !== 'loading' && <Results result={result} />}
      </div>
    </section>
  )
}

function IdleState() {
  return (
    <div className="empty">
      <h3 className="empty__title">Ask about this repository.</h3>
      <p className="empty__body">
        CodeAtlas recalls navigation skills it learned on other repos and decides which
        apply here. The ones it uses and the ones it deliberately sets aside both show up
        below.
      </p>
    </div>
  )
}

function Results({ result }: { result: AskResult }) {
  const used = result.skills.filter((s) => s.state === 'used')
  const ignored = result.skills.filter((s) => s.state === 'ignored')

  return (
    <>
      <div className="section-label">
        recalled skills
        <span className="section-label__rule" />
        <span>
          {used.length} used · {ignored.length} ignored
        </span>
      </div>

      {result.skills.length === 0 ? (
        <p className="empty__body" style={{ paddingTop: 'var(--s2)' }}>
          No prior skills surfaced for this query.
        </p>
      ) : (
        <>
          {used.map((s, i) => (
            <SkillCard key={`u-${i}`} skill={s} />
          ))}
          {ignored.map((s, i) => (
            <SkillCard key={`i-${i}`} skill={s} />
          ))}
        </>
      )}

      {result.answer && (
        <details className="answer">
          <summary>Full answer</summary>
          <div className="answer__body">{result.answer}</div>
        </details>
      )}
    </>
  )
}
