from fastapi import APIRouter, Depends

from codeatlas.app.di import get_repo_state_store
from codeatlas.schemas.repos import ListReposResponse
from codeatlas.services.state.repo_state_store import RepoStateStore

router = APIRouter(prefix="/repos", tags=["repository"])


@router.get("", response_model=ListReposResponse)
def list_repos(
    state_store: RepoStateStore = Depends(get_repo_state_store),
) -> ListReposResponse:
    return ListReposResponse(repo_ids=state_store.list_repo_ids())
