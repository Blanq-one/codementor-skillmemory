import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException

from codeatlas.app.di import get_repo_state_store
from codeatlas.schemas.files import FileEntry, ListFilesRequest, ListFilesResponse
from codeatlas.services.state.repo_state_store import RepoStateStore

router = APIRouter(prefix="/files", tags=["repository"])


@router.post("", response_model=ListFilesResponse)
def list_files(
    request: ListFilesRequest,
    state_store: RepoStateStore = Depends(get_repo_state_store),
) -> ListFilesResponse:
    state = state_store.get(request.repo_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Repository not found")

    files = []
    root_path = Path(state.root_path) if state.root_path else None
    
    # Common ignore list
    IGNORE_PATTERNS = {"__pycache__", ".git", ".pytest_cache", ".venv", "node_modules"}

    for source in state.parsed_repo.files:
        path_obj = Path(source.path)
        
        # Skip ignored patterns
        if any(part in IGNORE_PATTERNS for part in path_obj.parts):
            continue

        try:
            # If we have a root_path, use it
            if root_path and root_path.is_absolute():
                rel_path = path_obj.relative_to(root_path).as_posix()
            else:
                # Fallback: try to find the repos directory in the path and split from there
                # This helps with legacy indexed repos
                parts = path_obj.parts
                if "repos" in parts:
                    repos_idx = parts.index("repos")
                    # The folder after 'repos' is the UUID
                    rel_path = "/".join(parts[repos_idx + 2:])
                else:
                    rel_path = path_obj.name
                    
            if rel_path:
                files.append(FileEntry(path=rel_path, language=source.language))
        except (ValueError, IndexError):
            files.append(FileEntry(path=path_obj.name, language=source.language))

    files.sort(key=lambda entry: entry.path)
    return ListFilesResponse(files=files)
