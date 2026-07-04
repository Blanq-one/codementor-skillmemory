from fastapi import APIRouter, Depends

from codeatlas.app.di import get_config
from codeatlas.schemas.skills import ListSkillsResponse, SkillLogItem
from codeatlas.services.memory.skill_log import load_skills
from codeatlas.utils.config import AppConfig

router = APIRouter(prefix="/skills", tags=["memory"])


@router.get("", response_model=ListSkillsResponse)
def list_skills(config: AppConfig = Depends(get_config)) -> ListSkillsResponse:
    """List transferable skills the librarian has learned across repos, newest
    first. Backed by the JSON skills log (see skill_log)."""
    entries = load_skills(config.state_dir)
    items = [
        SkillLogItem(
            method=str(e.get("method", "")),
            source_repo=str(e.get("source_repo", "unknown")),
            ts=float(e.get("ts", 0) or 0),
        )
        for e in entries
    ]
    items.reverse()  # newest first
    return ListSkillsResponse(skills=items)
