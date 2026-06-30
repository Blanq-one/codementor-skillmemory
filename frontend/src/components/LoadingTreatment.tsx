import { useEffect, useState } from 'react'

const PHASES = ['Recalling skills', 'Planning approach', 'Composing answer'] as const

// Indicative timings for a 30-60s call. The last phase holds until the
// response actually arrives — we never claim completion early.
const ADVANCE_AT_MS = [0, 6000, 20000]

interface Props {
  onCancel: () => void
}

export function LoadingTreatment({ onCancel }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => setElapsed(Date.now() - start), 250)
    return () => window.clearInterval(id)
  }, [])

  let current = 0
  for (let i = 0; i < ADVANCE_AT_MS.length; i++) {
    if (elapsed >= ADVANCE_AT_MS[i]) current = i
  }

  const mins = Math.floor(elapsed / 60000)
  const secs = Math.floor((elapsed % 60000) / 1000)
  const clock = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="loading" role="status" aria-live="polite">
      <ul className="loading__phases">
        {PHASES.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <li key={label} className={`phase phase--${state}`}>
              <span className="phase__dot" />
              {label}
              {state === 'active' ? '…' : ''}
            </li>
          )
        })}
      </ul>
      <div className="loading__track" aria-hidden="true">
        <span className="loading__sweep" />
      </div>
      <div className="loading__meta">
        <p className="loading__note">
          Recall and planning run against the live memory graph — this can take up to a minute.
        </p>
        <span className="loading__elapsed" aria-label={`Elapsed ${clock}`}>
          {clock}
        </span>
      </div>
      <div style={{ marginTop: 'var(--s4)' }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
