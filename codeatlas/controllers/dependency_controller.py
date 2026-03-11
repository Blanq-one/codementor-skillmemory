from fastapi import APIRouter, Depends, HTTPException

from codeatlas.app.di import get_repo_state_store
from codeatlas.schemas.dependencies import DependenciesRequest, DependenciesResponse
from codeatlas.services.state.repo_state_store import RepoStateStore

router = APIRouter(prefix="/dependencies", tags=["dependency"])


@router.post("", response_model=DependenciesResponse)
def get_dependencies(
    request: DependenciesRequest,
    state_store: RepoStateStore = Depends(get_repo_state_store),
) -> DependenciesResponse:
    state = state_store.get(request.repo_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph = state.import_graph
    if request.node_id not in graph:
        raise HTTPException(status_code=404, detail="Node not found")

    if request.direction == "outbound":
        neighbors = list(graph.successors(request.node_id))
    else:
        neighbors = list(graph.predecessors(request.node_id))

    return DependenciesResponse(
        node_id=request.node_id,
        direction=request.direction,
        neighbors=sorted(neighbors),
    )
