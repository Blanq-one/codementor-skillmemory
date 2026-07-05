import { useNavigate } from "react-router-dom"
import { EntryPage } from "./EntryPage"
import { useRepos } from "./repos-context"

/** Route "/" — the landing hub. Opening a repo routes into its workspace. */
export function Landing() {
  const navigate = useNavigate()
  const { repos, reposLoaded, reposError, refresh } = useRepos()

  return (
    <EntryPage
      onOpenRepo={(id, opts) => {
        refresh() // a freshly analyzed repo should show up in the list
        navigate(`/repo/${id}/chat`, { state: { justAnalyzed: opts?.justAnalyzed } })
      }}
      onOpenSkills={() => {
        // Skill library lives in the workspace; open it for the first studied repo.
        if (repos[0]) navigate(`/repo/${repos[0]}/skills`)
      }}
      repos={repos}
      reposError={reposError}
      reposLoaded={reposLoaded}
    />
  )
}
