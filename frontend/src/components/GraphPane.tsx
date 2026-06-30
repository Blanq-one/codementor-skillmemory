import { repoLabel, type AskResult, type Skill } from '../api/client'
import type { Status } from '../App'

interface Props {
  status: Status
  result: AskResult | null
  question: string
  runId: number
}

const VB_W = 640
const VB_H = 460
const REPO_X = 120
const SKILL_X = 330
const QUERY_X = 512
const QUERY_Y = VB_H / 2
const BAND_TOP = 84
const BAND_BOTTOM = 400
const MAX_SKILLS = 6

function bandY(i: number, n: number): number {
  if (n <= 1) return QUERY_Y
  return BAND_TOP + ((i + 0.5) / n) * (BAND_BOTTOM - BAND_TOP)
}

function truncate(text: string, n: number): string {
  const t = text.trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

export function GraphPane({ status, result, question, runId }: Props) {
  const shown: Skill[] = (result?.skills ?? []).slice(0, MAX_SKILLS)
  const hasGraph = shown.length > 0

  return (
    <section className="pane pane--right" aria-label="Skill graph">
      <div className="pane__head">
        <h2 className="pane__title">Skill graph</h2>
        {hasGraph && (
          <span className="repo__label">
            {result!.skills.length} recalled
            {result!.skills.length > MAX_SKILLS ? ` · showing ${MAX_SKILLS}` : ''}
          </span>
        )}
      </div>

      <div className="graph">
        <svg
          className="graph__canvas"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            hasGraph
              ? `Recalled skills traced from their source repositories to the current query.`
              : 'Empty skill graph'
          }
        >
          {hasGraph ? (
            <Graph shown={shown} question={question} runId={runId} />
          ) : (
            <Scaffold dim={status === 'loading'} />
          )}
        </svg>

        {!hasGraph && (
          <div className="gempty">
            <GlyphIcon />
            <h3 className="gempty__title">
              {status === 'loading'
                ? 'Resolving skills…'
                : result
                  ? 'No skills to plot'
                  : 'The skill graph appears here'}
            </h3>
            <p className="gempty__body">
              {status === 'loading'
                ? 'Matching the query against learned skills.'
                : result
                  ? 'This query did not surface any prior skills to trace.'
                  : 'Run a query to see which learned skills surface — and the repository each one came from.'}
            </p>
          </div>
        )}

        <div className="graph__legend">
          <span className="legend__item">
            <span className="legend__swatch legend__swatch--used" /> used
          </span>
          <span className="legend__item">
            <span className="legend__swatch legend__swatch--ignored" /> recalled · ignored
          </span>
        </div>
      </div>
    </section>
  )
}

function Graph({
  shown,
  question,
  runId,
}: {
  shown: Skill[]
  question: string
  runId: number
}) {
  const repoOrder: string[] = []
  for (const s of shown) if (!repoOrder.includes(s.source_repo)) repoOrder.push(s.source_repo)

  const repoY = (repo: string) => bandY(repoOrder.indexOf(repo), repoOrder.length)
  const firstUsed = shown.findIndex((s) => s.state === 'used')

  return (
    <g>
      {/* column captions */}
      <text className="node-label" x={REPO_X} y={48} textAnchor="middle">
        source repos
      </text>
      <text className="node-label" x={SKILL_X} y={48} textAnchor="middle">
        skills
      </text>
      <text className="node-label" x={QUERY_X} y={48} textAnchor="middle">
        query
      </text>

      {/* edges */}
      {shown.map((s, i) => {
        const sy = bandY(i, shown.length)
        const ry = repoY(s.source_repo)
        const isTrace = i === firstUsed
        if (isTrace) {
          // The one signature animation: a single trace drawn from the source
          // repo, through the skill node, to the query.
          return (
            <path
              key={`trace-${runId}`}
              className="trace"
              pathLength={100}
              d={`M ${REPO_X} ${ry} L ${SKILL_X} ${sy} L ${QUERY_X} ${QUERY_Y}`}
            />
          )
        }
        const cls = s.state === 'used' ? 'edge edge--used' : 'edge edge--ignored'
        return (
          <g key={`edge-${i}`}>
            <path className={cls} d={`M ${REPO_X} ${ry} L ${SKILL_X} ${sy}`} />
            <path className={cls} d={`M ${SKILL_X} ${sy} L ${QUERY_X} ${QUERY_Y}`} />
          </g>
        )
      })}

      {/* repo nodes */}
      {repoOrder.map((repo) => {
        const y = repoY(repo)
        return (
          <g key={`repo-${repo}`}>
            <circle className="node-circle" cx={REPO_X} cy={y} r={5} />
            <text className="node-label" x={REPO_X - 12} y={y + 3.5} textAnchor="end">
              {repoLabel(repo)}
            </text>
          </g>
        )
      })}

      {/* skill nodes */}
      {shown.map((s, i) => {
        const y = bandY(i, shown.length)
        const cls =
          s.state === 'used' ? 'node-circle node-circle--used' : 'node-circle node-circle--ignored'
        return (
          <g key={`skill-${i}`}>
            <title>{s.method}</title>
            <circle className={cls} cx={SKILL_X} cy={y} r={8} />
            <text
              className="node-label node-label--strong"
              x={SKILL_X}
              y={y + 3.5}
              textAnchor="middle"
            >
              {i + 1}
            </text>
          </g>
        )
      })}

      {/* query node */}
      <circle className="node-circle node-circle--query" cx={QUERY_X} cy={QUERY_Y} r={9} />
      <text
        className="node-label node-label--strong"
        x={QUERY_X}
        y={QUERY_Y + 26}
        textAnchor="middle"
      >
        {truncate(question || 'query', 16)}
      </text>
    </g>
  )
}

/** Faint static scaffold shown behind the empty / loading state. */
function Scaffold({ dim }: { dim: boolean }) {
  const ys = [bandY(0, 3), bandY(1, 3), bandY(2, 3)]
  return (
    <g opacity={dim ? 0.22 : 0.32}>
      {ys.map((y, i) => (
        <g key={i}>
          <path className="edge" d={`M ${REPO_X} ${y} L ${SKILL_X} ${y}`} />
          <path className="edge" d={`M ${SKILL_X} ${y} L ${QUERY_X} ${QUERY_Y}`} />
          <circle className="node-circle" cx={REPO_X} cy={y} r={5} />
          <circle className="node-circle" cx={SKILL_X} cy={y} r={7} />
        </g>
      ))}
      <circle className="node-circle node-circle--query" cx={QUERY_X} cy={QUERY_Y} r={9} />
    </g>
  )
}

function GlyphIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="7" cy="13" r="3" stroke="var(--text-muted)" strokeWidth="1.3" />
      <circle cx="7" cy="27" r="3" stroke="var(--text-muted)" strokeWidth="1.3" />
      <circle cx="20" cy="20" r="3.4" stroke="var(--text-muted)" strokeWidth="1.3" />
      <circle cx="33" cy="20" r="3.4" stroke="var(--accent-recall)" strokeWidth="1.3" />
      <path
        d="M10 13.5 17 19M10 26.5 17 21M23 20h7"
        stroke="var(--text-muted)"
        strokeWidth="1.3"
      />
    </svg>
  )
}
