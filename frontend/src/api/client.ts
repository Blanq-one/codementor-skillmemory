export type SkillState = 'used' | 'ignored'

export interface Skill {
  method: string
  source_repo: string
  state: SkillState
  reason?: string | null
}

export interface AskResult {
  answer: string
  citations: string[]
  reasoning_steps: string[]
  skills: Skill[]
}

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export async function fetchRepos(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${BASE}/repos`, { signal })
  if (!res.ok) throw new Error(`Could not load repositories (${res.status})`)
  const data = (await res.json()) as { repo_ids?: string[] }
  return data.repo_ids ?? []
}

export async function askQuestion(
  repoId: string,
  question: string,
  signal?: AbortSignal,
): Promise<AskResult> {
  const res = await fetch(`${BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_id: repoId, question }),
    signal,
  })
  if (!res.ok) {
    throw new Error(`The request failed (${res.status}). Is the backend running?`)
  }
  const data = (await res.json()) as Partial<AskResult>
  return {
    answer: data.answer ?? '',
    citations: data.citations ?? [],
    reasoning_steps: data.reasoning_steps ?? [],
    skills: data.skills ?? [],
  }
}

export interface AnalyzeResult {
  repository_id: string
  file_count: number
  dependency_edges: number
  indexing_status: string
}

/**
 * Kick off repo analysis. The backend blocks through clone + parse + dependency
 * graph (can take minutes), then queues embedding/indexing as a background task
 * and returns. So this request stays outstanding for a while by design.
 */
export async function analyzeRepo(repoUrl: string, signal?: AbortSignal): Promise<AnalyzeResult> {
  const res = await fetch(`${BASE}/analyze-repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl }),
    signal,
  })
  if (res.status === 422) {
    throw new Error('That does not look like a valid repository URL.')
  }
  if (!res.ok) {
    throw new Error(`Analysis failed (${res.status}). Is the backend running on :8000?`)
  }
  return (await res.json()) as AnalyzeResult
}

export interface SkillLogItem {
  method: string
  source_repo: string
  ts: number
}

/** List the transferable skills the librarian has learned (newest first). */
export async function fetchSkills(signal?: AbortSignal): Promise<SkillLogItem[]> {
  const res = await fetch(`${BASE}/skills`, { signal })
  if (!res.ok) throw new Error(`Could not load the skill library (${res.status}).`)
  const data = (await res.json()) as { skills?: SkillLogItem[] }
  return data.skills ?? []
}

/** Short, stable label for a repo id or source tag. */
export function repoLabel(id: string): string {
  if (!id || id === 'unknown') return 'unknown'
  // UUID-style ids: show the first segment; otherwise show as-is.
  const head = id.split('-')[0]
  return head.length >= 8 ? head : id
}
