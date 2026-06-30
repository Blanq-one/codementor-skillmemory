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

/** Short, stable label for a repo id or source tag. */
export function repoLabel(id: string): string {
  if (!id || id === 'unknown') return 'unknown'
  // UUID-style ids: show the first segment; otherwise show as-is.
  const head = id.split('-')[0]
  return head.length >= 8 ? head : id
}
