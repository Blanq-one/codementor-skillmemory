from pydantic import BaseModel


class SkillLogItem(BaseModel):
    method: str
    source_repo: str
    ts: float


class ListSkillsResponse(BaseModel):
    skills: list[SkillLogItem] = []
